import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';

export const collections = createTRPCRouter({
	getUserCollections: protectedProcedure.query(({ ctx: { userId } }) =>
		prisma.collection.findMany({
			where: { ownerId: userId },
			orderBy: { name: 'asc' }
		})
	),
	getCollection: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.collection.findUniqueOrThrow({ where: { id: input } })),

	deleteCollection: protectedProcedure.input(z.string()).mutation(async ({ input: id }) => {
		await prisma.collection.delete({ where: { id } });
	})
});
