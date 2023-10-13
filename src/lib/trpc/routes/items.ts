import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { z } from 'zod';

export const items = createTRPCRouter({
	getCollectionItems: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findMany({ where: { collectionId: input } })),

	getItem: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findUnique({ where: { id: input } }))
});
