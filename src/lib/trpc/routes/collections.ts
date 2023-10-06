import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';

export const collections = createTRPCRouter({
	getUserCollections: protectedProcedure.query(({ ctx: { userId } }) =>
		prisma.collection.findMany({
			where: { ownerId: userId },
			orderBy: { name: 'asc' }
		})
	)
});
