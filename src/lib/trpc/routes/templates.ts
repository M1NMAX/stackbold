import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { z } from 'zod';

export const templates = createTRPCRouter({
	list: protectedProcedure.query(() =>
		prisma.template.findMany({
			orderBy: { createdAt: 'asc' }
		})
	),
	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.template.findUniqueOrThrow({ where: { id: input } }))
});
