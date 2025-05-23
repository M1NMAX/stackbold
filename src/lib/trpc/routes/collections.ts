import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
	PropertyCreateInputSchema,
	ColorSchema,
	PropertyTypeSchema,
	AggregatorSchema,
	ViewSchema
} from '$prisma-zod';
import { View } from '@prisma/client';

const groupByConfigSchema = z.object({
	view: ViewSchema,
	propertyId: z.string()
});

const filterConfigsSchema = z.object({
	view: ViewSchema,
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
	}),

	addProperty: protectedProcedure
		.input(z.object({ id: z.string(), property: PropertyCreateInputSchema }))
		.mutation(async ({ input: { id, property } }) => {
			return await prisma.collection.update({
				data: { properties: { push: [property] } },
				where: { id }
			});
		}),

	updateProperty: protectedProcedure
		.input(collectionUpdatePropertySchema)
		.mutation(async ({ input: { id, property } }) => {
			const { id: pid, ...rest } = property;

			return await prisma.collection.update({
				where: { id },
				data: { properties: { updateMany: { where: { id: pid }, data: rest } } }
			});
		}),

	deleteProperty: protectedProcedure
		.input(z.object({ id: z.string(), propertyId: z.string() }))
		.mutation(async ({ input: { id, propertyId } }) => {
			await prisma.collection.update({
				data: { properties: { deleteMany: { where: { id: propertyId } } } },
				where: { id }
			});
		}),

	addPropertyOption: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				property: z.object({
					id: z.string(),
					option: z.object({
						value: z.string(),
						color: z.lazy(() => ColorSchema).optional()
					})
				})
			})
		)
		.mutation(async ({ input: { id, property } }) => {
			return await prisma.collection.update({
				data: {
					properties: {
						updateMany: {
							where: { id: property.id },
							data: { options: { push: [property.option] } }
						}
					}
				},
				where: { id }
			});
		}),

	updatePropertyOption: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				property: z.object({
					id: z.string(),
					option: z.object({
						id: z.string(),
						value: z.string().optional(),
						color: z.lazy(() => ColorSchema).optional()
					})
				})
			})
		)
		.mutation(async ({ input: { id, property } }) => {
			const { id: oid, ...rest } = property.option;

			return await prisma.collection.update({
				data: {
					properties: {
						updateMany: {
							where: { id: property.id },
							data: { options: { updateMany: { where: { id: oid }, data: rest } } }
						}
					}
				},
				where: { id }
			});
		}),

	deletePropertyOption: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				property: z.object({
					id: z.string(),
					optionId: z.string()
				})
			})
		)
		.mutation(async ({ input: { id, property } }) => {
			return await prisma.collection.update({
				data: {
					properties: {
						updateMany: {
							where: { id: property.id },
							data: { options: { deleteMany: { where: { id: property.optionId } } } }
						}
					}
				},
				where: { id }
			});
		})
});
