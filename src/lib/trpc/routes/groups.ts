import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const groupCreateSchema = z.object({ id: z.string(), name: z.string() });

export const groups = createTRPCRouter({
	list: protectedProcedure.query(({ ctx: { userId } }) => {
		return prisma.group.findMany({
			where: { ownerId: userId },
			orderBy: { name: 'asc' }
		});
	}),

	create: protectedProcedure.input(groupCreateSchema).mutation(
		async ({ input: data, ctx: { userId } }) =>
			await prisma.group.create({
				data: { ...data, ownerId: userId }
			})
	),
	update: protectedProcedure
		.input(groupCreateSchema)
		.mutation(
			async ({ input: { id, ...rest } }) =>
				await prisma.group.update({ where: { id }, data: { ...rest } })
		),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const group = await prisma.group.findUniqueOrThrow({ where: { id } });

		if (group.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		await prisma.group.delete({ where: { id } });
	})
});
