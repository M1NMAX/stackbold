import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { NAME_FIELD } from '$lib/constant/index.js';

const collectionCreateSchema = z.object({
	icon: z.string().optional(),
	name: z.string(),
	isPinned: z.boolean().optional(),
	description: z.string().optional(),
	isDescHidden: z.boolean().optional(),
	groupId: z.string().nullable().optional()
});

const collectionUpdateSchema = collectionCreateSchema
	.merge(z.object({ id: z.string() }))
	.partial({ name: true });

export const collections = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx: { userId } }) => {
		return await prisma.collection.findMany({
			where: { ownerId: userId },
			include: { views: true },
			orderBy: { createdAt: 'asc' }
		});
	}),
	load: protectedProcedure.input(z.string()).query(async ({ input }) => {
		return await prisma.collection.findUnique({ where: { id: input } });
	}),

	create: protectedProcedure
		.input(collectionCreateSchema)
		.mutation(async ({ input: collectionData, ctx: { userId } }) => {
			return await prisma.collection.create({
				data: { ownerId: userId, ...collectionData },
				include: { views: true }
			});
		}),

	duplicate: protectedProcedure
		.input(z.string())
		.mutation(async ({ input }) => await duplicateCollection(input)),

	update: protectedProcedure
		.input(collectionUpdateSchema)
		.mutation(
			async ({ input: { id, ...rest } }) =>
				await prisma.collection.update({ where: { id }, data: { ...rest } })
		),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const collection = await prisma.collection.findUniqueOrThrow({ where: { id } });

		if (collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		await prisma.collection.delete({ where: { id } });
	})
});

async function duplicateCollection(id: string) {
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
				name: rest.name + ' copy',
				filterConfigs: undefined,
				groupByConfigs: undefined,
				properties: { create: [...propertiesData] }
			},
			include: {
				properties: { orderBy: { order: 'asc' } }
			}
		});

		let propertyIdsMap = new Map<string, string>();
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
			tx.view.createMany({ data: viewsData }),
			tx.item.createMany({ data: itemData })
		]);

		return await tx.collection.findUniqueOrThrow({
			where: { id: collection.id },
			include: { views: true }
		});
	});
}
