import { prisma } from '$lib/server/prisma';
import { adminProcedure, createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const users = createTRPCRouter({
	list: adminProcedure.query(() =>
		prisma.user.findMany({
			orderBy: { name: 'asc' }
		})
	),
	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.user.findUniqueOrThrow({ where: { id: input } })),
	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId, session } }) => {
			const user = await prisma.user.findUniqueOrThrow({ where: { id } });

			if (session.user.role !== 'ADMIN' && user.id !== userId)
				throw new TRPCError({ code: 'UNAUTHORIZED' });

			await prisma.user.delete({ where: { id } });
		})
});
