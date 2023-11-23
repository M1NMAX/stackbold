import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';

export const groups = createTRPCRouter({
	list: protectedProcedure.query(({ ctx: { userId } }) => {
		return prisma.group.findMany({
			where: { ownerId: userId },
			orderBy: { name: 'asc' }
		});
	})
});
