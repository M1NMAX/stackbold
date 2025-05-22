import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { View } from '@prisma/client';

const viewSchema = z.nativeEnum(View);

const groupByConfigSchema = z.object({
	view: viewSchema,
	propertyId: z.string()
});

const filterConfigsSchema = z.object({
	view: viewSchema,
	filters: z.array(
		z.object({
			id: z.string(),
			values: z.array(z.string())
		})
	)
});

const defaultGroupByConfigs = [
	{ view: View.LIST, propertyId: '' },
	{ view: View.TABLE, propertyId: '' }
];

const defaultFilterConfigs = [
	{ view: View.LIST, filters: [] },
	{ view: View.TABLE, filters: [] }
];

const collectionCreateSchema = z.object({
	icon: z.string().optional(),
	name: z.string(),
	isPinned: z.boolean().optional(),
	description: z.string().optional(),
	isDescHidden: z.boolean().optional(),
	groupId: z.string().nullable().optional(),
	groupByConfigs: z.array(groupByConfigSchema).optional().default(defaultGroupByConfigs),
	filterConfigs: z.array(filterConfigsSchema).optional().default(defaultFilterConfigs),
	properties: z
		.array(
			z.object({
				id: z.string().optional(),
				name: z.string(),
				type: PropertyTypeSchema.optional(),
				aggregator: AggregatorSchema.optional(),
				defaultValue: z.string().optional(),
				visibleInViews: z.array(ViewSchema).optional(),
				order: z.number().optional(),
				options: z
					.array(
						z.object({
							id: z.string().optional(),
							value: z.string(),
							color: z.lazy(() => ColorSchema).optional()
						})
					)
					.optional()
			})
		)
		.optional()
});

const collectionUpdateSchema = z.object({
	id: z.string(),
	data: z.object({
		icon: z.string().optional(),
		name: z.string().optional(),
		isPinned: z.boolean().optional(),
		description: z.string().optional(),
		isDescHidden: z.boolean().optional(),
		groupId: z.string().nullable().optional(),
		groupByConfigs: z.array(groupByConfigSchema).optional(),
		filterConfigs: z.array(filterConfigsSchema).optional()
	})
});

const collectionUpdatePropertySchema = z.object({
	id: z.string(),
	property: z.object({
		id: z.string(),
		name: z.string().optional(),
		type: PropertyTypeSchema.optional(),
		aggregator: AggregatorSchema.optional(),
		defaultValue: z.string().optional(),
		visibleInViews: z.array(ViewSchema).optional(),
		order: z.number().optional(),
		options: z
			.array(
				z.object({
					id: z.string(),
					value: z.string(),
					color: z.lazy(() => ColorSchema)
				})
			)
			.optional()
	})
});

export const collections = createTRPCRouter({
	list: protectedProcedure.query(({ ctx: { userId } }) =>
		prisma.collection
			.findMany({
				where: { ownerId: userId },
				orderBy: { createdAt: 'asc' },
				include: { _count: { select: { items: true } } }
			})
			.then((collections) =>
				collections.map(({ _count: { items }, ...rest }) => ({ nItems: items, ...rest }))
			)
	),
	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.collection.findUniqueOrThrow({ where: { id: input } })),

	create: protectedProcedure.input(collectionCreateSchema).mutation(
		async ({ input: collectionData, ctx: { userId } }) =>
			await prisma.collection.create({
				data: { ownerId: userId, ...collectionData }
			})
	),
	update: protectedProcedure
		.input(collectionUpdateSchema)
		.mutation(
			async ({ input: { id, data } }) => await prisma.collection.update({ data, where: { id } })
		),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const collection = await prisma.collection.findUniqueOrThrow({ where: { id } });

		if (collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		await prisma.collection.delete({ where: { id } });
		})
});
