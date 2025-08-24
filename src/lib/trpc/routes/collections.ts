import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { PROPERTIES_WITHOUT_REF } from '$lib/constant/index.js';

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

	duplicate: protectedProcedure.input(z.string()).mutation(async ({ input: id }) => {
		const target = await prisma.collection.findUniqueOrThrow({
			where: { id },
			include: { items: true, properties: true }
		});

		const { id: _1, createdAt: _2, updatedAt: _3, properties, items, ...rest } = target;

		const collection = await prisma.collection.create({
			data: {
				...rest,
				name: rest.name + ' copy',
				filterConfigs: undefined,
				groupByConfigs: undefined
			},
			include: { views: true }
		});

		const propertiesData = properties.map((property) => {
			const { id: _1, createdAt: _2, updatedAt: _3, ...rest } = property;
			return {
				...rest,
				collectionId: collection.id
			};
		});

		await prisma.property.createMany({ data: propertiesData });

		const createdProperies = await prisma.property.findMany({
			where: {
				collectionId: collection.id,
				type: { notIn: PROPERTIES_WITHOUT_REF }
			},
			orderBy: { order: 'asc' }
		});

		const itemData = items.map((item) => {
			const { id: _1, createdAt: _2, updatedAt: _3, ...rest } = item;

			let refs = [];
			for (let i = 0; i < createdProperies.length; i++) {
				refs.push({
					id: createdProperies[i].id,
					value: rest.properties[i].value
				});
			}

			return { ...rest, collectionId: collection.id, properties: refs };
		});

		await prisma.item.createMany({ data: itemData });

		return collection;
	}),

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
