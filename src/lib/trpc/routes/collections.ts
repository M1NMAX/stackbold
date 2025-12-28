import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { NAME_FIELD } from '$lib/constant/index.js';
import { ViewType } from '@prisma/client';
import { capitalizeFirstLetter } from '$lib/utils/index.js';
import { listObjects, removeObjects } from '$lib/server/minio';

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
			include: { views: true },
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
		.mutation(async ({ input, ctx: { userId } }) => await duplicateCollection(input, userId, true)),

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
	const views = Object.values(ViewType).map((v, idx) => ({
		shortId: idx + 1,
		order: idx + 1,
		name: capitalizeFirstLetter(v),
		type: v as ViewType,
		properties: [],
		filters: [],
		sorts: []
	}));

	return await prisma.collection.create({
		data: { ...args, ownerId: userId, views: { create: [...views] } },
		include: { views: { select: { shortId: true } } }
	});
}

export async function duplicateCollection(id: string, ownerId: string, copy: boolean = false) {
	const target = await prisma.collection.findUniqueOrThrow({
		where: { id },
		include: {
			views: true,
			items: true,
			properties: {
				orderBy: { order: 'asc' }
			}
		}
	});

	const { id: _1, createdAt: _2, updatedAt: _3, views, properties, items, ...rest } = target;

	const oldPropertyIdToOrder = new Map<number, string>(
		properties.map((property) => [property.order, property.id])
	);

	const propertiesData = properties.map((property) => {
		const { id: _1, createdAt: _2, updatedAt: _3, collectionId: _4, ...rest } = property;
		return {
			...rest
		};
	});

	return await prisma.$transaction(async (tx) => {
		const collection = await tx.collection.create({
			data: {
				...rest,
				ownerId,
				isTemplate: false,
				name: copy ? `${rest.name} copy` : rest.name,
				properties: { create: [...propertiesData] }
			},
			include: {
				properties: { orderBy: { order: 'asc' } }
			}
		});

		const propertyIdsMap = new Map<string, string>();
		for (const property of collection.properties) {
			const oldId = oldPropertyIdToOrder.get(property.order);
			if (oldId) propertyIdsMap.set(oldId, property.id);
		}

		const viewsData = views.map((view) => {
			const { id: _1, createdAt: _2, updatedAt: _3, collectionId: _4, ...rest } = view;

			let groupBy = undefined;
			if (rest.groupBy) {
				const id = propertyIdsMap.get(rest.groupBy);
				groupBy = id ?? undefined;
			}

			const sorts = rest.sorts.map((sort) => {
				if (sort.field === NAME_FIELD) return { ...sort };
				const id = propertyIdsMap.get(sort.field);
				return id ? { ...sort, field: id } : null;
			});

			const filters = rest.filters.map((filter) => {
				const id = propertyIdsMap.get(filter.id);
				return id ? { ...filter, id } : null;
			});

			const properties = rest.properties.map((property) => {
				const id = propertyIdsMap.get(property.id);
				return id ? { ...property, id } : null;
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

		const itemData = items.map((item) => {
			const { id: _1, createdAt: _2, updatedAt: _3, ...rest } = item;

			const refs = rest.properties.map((ref) => {
				const id = propertyIdsMap.get(ref.id);
				return id ? { ...ref, id } : null;
			});

			return {
				...rest,
				collectionId: collection.id,
				properties: refs.filter((r) => r != null)
			};
		});

		await Promise.all([
			viewsData.length !== 0 ? tx.view.createMany({ data: viewsData }) : Promise.resolve(),
			itemData.length !== 0 ? tx.item.createMany({ data: itemData }) : Promise.resolve()
		]);

		return await tx.collection.findUniqueOrThrow({
			where: { id: collection.id },
			include: { views: { select: { shortId: true } } }
		});
	});
}

async function deleteCollection(id: string, userId: string) {
	const collection = await prisma.collection.findUniqueOrThrow({ where: { id } });
	if (collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

	const objectsList = await listObjects(`collections/collection-${collection.id}/`);
	await removeObjects(objectsList);

	await prisma.collection.delete({ where: { id } });
}
