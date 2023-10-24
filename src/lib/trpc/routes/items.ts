import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import {
	ItemCreateWithoutCollectionInputSchema,
	ItemPropertyCreateInputSchema,
	ItemUpdateInputSchema
} from '$prisma-zod';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const items = createTRPCRouter({
	getCollectionItems: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findMany({ where: { collectionId: input } })),

	getItem: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findUnique({ where: { id: input } })),

	createItem: protectedProcedure
		.input(z.object({ collectionId: z.string(), itemData: ItemCreateWithoutCollectionInputSchema }))
		.mutation(async ({ input: { collectionId, itemData } }) => {
			await prisma.item.create({
				data: { ...itemData, collection: { connect: { id: collectionId } } }
			});
		}),

	updateItem: protectedProcedure
		.input(z.object({ id: z.string(), data: ItemUpdateInputSchema }))
		.mutation(async ({ input: { id, data }, ctx: { userId } }) => {
			Object.assign(data, { updateByUserId: userId });

			await prisma.item.update({
				data,
				where: { id }
			});
		}),

	deleteItem: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId } }) => {
			const item = await prisma.item.findUniqueOrThrow({
				select: { collection: true },
				where: { id }
			});
			if (item.collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

			await prisma.item.delete({ where: { id } });
		}),
	addProperty: protectedProcedure
		.input(z.object({ id: z.string(), property: ItemPropertyCreateInputSchema }))
		.mutation(async ({ input: { id, property }, ctx: { userId } }) => {
			await prisma.item.update({
				data: { properties: { push: [property] } },
				where: { id }
			});
		}),
	updateProperty: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				property: z.object({ id: z.string(), value: z.string() })
			})
		)
		.mutation(async ({ input: { id, property }, ctx: { userId } }) => {
			const { id: pid, ...rest } = property;

			await prisma.item.update({
				where: { id },
				data: {
					properties: { updateMany: { where: { id: pid }, data: rest } }
				}
			});
		}),
	deleteProperty: protectedProcedure
		.input(z.object({ id: z.string(), propertyId: z.string() }))
		.mutation(async ({ input: { id, propertyId }, ctx: { userId } }) => {
			await prisma.item.update({
				data: { properties: { deleteMany: { where: { id: propertyId } } } },
				where: { id }
			});
		})
});
