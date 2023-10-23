import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import {
	ItemCreateInputSchema,
	ItemCreateWithoutCollectionInputSchema,
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
		})
});
