import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { z } from 'zod';

export const items = createTRPCRouter({
	getCollectionItems: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findMany({ where: { collectionId: input } })),

	getItem: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findUnique({ where: { id: input } })),
	deleteItem: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId } }) => {
			console.log(userId);
			await prisma.item.delete({ where: { id } });
		})
});
