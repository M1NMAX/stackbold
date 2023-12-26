import { prisma } from '$lib/server/prisma';
import { adminProcedure, createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { z } from 'zod';

export const users = createTRPCRouter({
	list: adminProcedure.query(() =>
		prisma.user.findMany({
			orderBy: { name: 'asc' }
		})
	),
	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.user.findUniqueOrThrow({ where: { id: input } }))
});
