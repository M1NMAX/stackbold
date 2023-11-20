import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
	CollectionCreateWithoutOwnerInputSchema,
	CollectionPropertyCreateInputSchema,
	CollectionUpdateInputSchema,
	ColorSchema,
	PropertyTypeSchema
} from '$prisma-zod';

export const collections = createTRPCRouter({
	list: protectedProcedure.query(({ ctx: { userId } }) =>
		prisma.collection.findMany({
			where: { ownerId: userId },
			orderBy: { createdAt: 'asc' }
		})
	),
	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.collection.findUniqueOrThrow({ where: { id: input } })),

	create: protectedProcedure.input(CollectionCreateWithoutOwnerInputSchema).mutation(
		async ({ input: collectionData, ctx: { userId } }) =>
			await prisma.collection.create({
				data: { ownerId: userId, ...collectionData }
			})
	),
	update: protectedProcedure
		.input(z.object({ id: z.string(), data: CollectionUpdateInputSchema }))
		.mutation(async ({ input: { id, data }, ctx: userId }) => {
			await prisma.collection.update({ data, where: { id } });
		}),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const collection = await prisma.collection.findUniqueOrThrow({ where: { id } });

		if (collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		await prisma.collection.delete({ where: { id } });
	}),

	addProperty: protectedProcedure
		.input(z.object({ id: z.string(), property: CollectionPropertyCreateInputSchema }))
		.mutation(async ({ input: { id, property }, ctx: { userId } }) => {
			return await prisma.collection.update({
				data: { properties: { push: [property] } },
				where: { id }
			});
		}),

	updateProperty: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				property: z.object({
					id: z.string(),
					name: z.string().optional(),
					type: PropertyTypeSchema.optional(),
					isVisibleOnListView: z.boolean().optional(),
					isVisibleOnTableView: z.boolean().optional(),
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
			})
		)
		.mutation(async ({ input: { id, property }, ctx: { userId } }) => {
			const { id: pid, ...rest } = property;

			return await prisma.collection.update({
				where: { id },
				data: { properties: { updateMany: { where: { id: pid }, data: rest } } }
			});
		}),

	deleteProperty: protectedProcedure
		.input(z.object({ id: z.string(), propertyId: z.string() }))
		.mutation(async ({ input: { id, propertyId }, ctx: { userId } }) => {
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
		.mutation(async ({ input: { id, property }, ctx: { userId } }) => {
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
		.mutation(async ({ input: { id, property }, ctx: { userId } }) => {
			const { id: oid, ...rest } = property.option;

			await prisma.collection.update({
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
		.mutation(async ({ input: { id, property }, ctx: { userId } }) => {
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
