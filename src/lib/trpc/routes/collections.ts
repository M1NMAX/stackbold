import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { BASE_FIELDS, DEFAULT_COLLECTION_ICON, NAME_FIELD } from '$lib/constant/index.js';
import { ViewType } from '@prisma/client';
import { capitalizeFirstLetter, omit } from '$lib/utils/index.js';
import { listObjects, removeObjects } from '$lib/server/minio';
import type { PropertiesSnapshot, PropertyWithOptions } from '$lib/types.js';

const collectionCreateSchema = z.object({
	icon: z.string().optional(),
	name: z.string(),
	isPinned: z.boolean().optional(),
	description: z.string().optional(),
	isDescHidden: z.boolean().optional(),
	groupId: z.string().nullable().optional()
});

const collectionUpdateSchema = collectionCreateSchema
	.extend({ id: z.string() })
	.partial({ name: true });

export const collections = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx: { userId } }) => {
		return await prisma.collection.findMany({
			where: { ownerId: userId },
			include: { views: { select: { shortId: true } }, _count: { select: { items: true } } },
			orderBy: { name: 'asc' }
		});
	}),
	load: protectedProcedure.input(z.string()).query(async ({ input }) => {
		return await prisma.collection.findUnique({
			where: { id: input },
			include: { views: { orderBy: [{ order: 'asc' }, { shortId: 'asc' }] } }
		});
	}),

	create: protectedProcedure
		.input(collectionCreateSchema)
		.mutation(async ({ input, ctx: { userId } }) => await createCollection(input, userId)),

	duplicate: protectedProcedure
		.input(z.string())
		.mutation(async ({ input, ctx: { userId } }) => await duplicateCollection(input, userId)),

	update: protectedProcedure
		.input(collectionUpdateSchema)
		.mutation(
			async ({ input: { id, ...rest } }) =>
				await prisma.collection.update({ where: { id }, data: { ...rest } })
		),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ input, ctx: { userId } }) => deleteCollection(input, userId))
});

async function createCollection(args: z.infer<typeof collectionCreateSchema>, userId: string) {
	const defaultView = {
		shortId: 1,
		order: 1,
		name: capitalizeFirstLetter(ViewType.LIST),
		type: ViewType.LIST,
		properties: [],
		filters: [],
		sorts: []
	};

	return await prisma.collection.create({
		data: {
			...args,
			ownerId: userId,
			icon: DEFAULT_COLLECTION_ICON,
			views: { create: [defaultView] }
		},
		include: { views: { select: { shortId: true } }, _count: { select: { items: true } } }
	});
}

export async function duplicateCollection(id: string, ownerId: string) {
	const target = await prisma.collection.findUnique({
		where: { id },
		include: {
			views: true,
			items: true,
			properties: {
				orderBy: { order: 'asc' },
				include: { options: { orderBy: { order: 'asc' } } }
			}
		}
	});

	if (!target) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Collection not found' });

	const rest = omit(target, [...BASE_FIELDS, 'views', 'properties', 'items']);

	const propertiesData: ReturnType<typeof mapPropertyData>[] = [];
	const snapshots = new Map<string, PropertiesSnapshot>();

	for (const property of target.properties) {
		propertiesData.push(mapPropertyData(property));

		snapshots.set(`${property.name}-${property.order}`, {
			id: property.id,
			optionsIds: new Map<string, string>(
				property.options.map((o) => [`${o.value}-${o.order}`, o.id])
			)
		});
	}

	return await prisma.$transaction(async (tx) => {
		const collection = await tx.collection.create({
			data: {
				...rest,
				ownerId,
				isTemplate: false,
				name: target.isTemplate ? rest.name : `${rest.name} copy`,
				properties: { create: [...propertiesData] }
			},
			include: {
				properties: {
					orderBy: { order: 'asc' },
					include: { options: { orderBy: { order: 'asc' } } }
				}
			}
		});

		const propertyIdsMap = new Map<string, string>();
		const newSnapshots = new Map<string, PropertiesSnapshot>();
		for (const property of collection.properties) {
			const key = `${property.name}-${property.order}`;
			const snap = snapshots.get(key);
			if (!snap) continue;
			newSnapshots.set(snap.id, {
				id: property.id,
				optionsIds: new Map<string, string>(
					property.options.flatMap((o) => {
						const oldOption = snap.optionsIds.get(`${o.value}-${o.order}`);
						return oldOption ? [[oldOption, o.id]] : [];
					})
				)
			});
		}

		const viewsData = target.views.map((view) => {
			const rest = omit(view, [...BASE_FIELDS, 'collectionId']);

			let groupBy = undefined;
			if (rest.groupBy) {
				const id = propertyIdsMap.get(rest.groupBy);
				groupBy = id ?? undefined;
			}

			const sorts = rest.sorts.map((sort) => {
				if (sort.field === NAME_FIELD) return { ...sort };

				const snap = newSnapshots.get(sort.field);
				return snap ? { ...sort, field: snap.id } : null;
			});

			const filters = rest.filters.map((filter) => {
				const snap = newSnapshots.get(filter.id);
				return snap ? { ...filter, id: snap.id } : null;
			});

			const properties = rest.properties.map((property) => {
				const snap = newSnapshots.get(property.id);
				return snap ? { ...property, id: snap.id } : null;
			});

			return {
				...rest,
				groupBy,
				collectionId: collection.id,
				sorts: sorts.filter((s) => s != null),
				filters: filters.filter((f) => f != null),
				properties: properties.filter((p) => p != null)
			};
		});

		const itemData = target.items.map((item) => {
			const rest = omit(item, [...BASE_FIELDS]);

			const refs = rest.properties.flatMap((ref) => {
				const snap = newSnapshots.get(ref.id);
				if (!snap) return [];

				const value = (ref.value && snap.optionsIds.get(ref.value)) || ref.value;

				return [{ id: snap.id, value }];
			});

			return {
				...rest,
				collectionId: collection.id,
				properties: refs
			};
		});

		await Promise.all([
			viewsData.length !== 0 ? tx.view.createMany({ data: viewsData }) : Promise.resolve(),
			itemData.length !== 0 ? tx.item.createMany({ data: itemData }) : Promise.resolve()
		]);

		return await tx.collection.findUniqueOrThrow({
			where: { id: collection.id },
			include: { views: { select: { shortId: true } }, _count: { select: { items: true } } }
		});
	});
}

function mapPropertyData(property: PropertyWithOptions) {
	const base = omit(property, [...BASE_FIELDS, 'collectionId']);

	const optionData = property.options.map((option) => omit(option, [...BASE_FIELDS, 'propertyId']));

	return {
		...base,
		options: { create: [...optionData] }
	};
}

async function deleteCollection(id: string, userId: string) {
	const collection = await prisma.collection.findUniqueOrThrow({ where: { id } });
	if (collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

	const objectsList = await listObjects(`collections/collection-${collection.id}/`);
	await removeObjects(objectsList);

	await prisma.collection.delete({ where: { id } });
}
