import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { GroupCreateWithoutOwnerInputSchema, GroupUpdateInputSchema } from '$prisma-zod';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const groupUpdateSchema = z.object({
	id: z.string(),
	data: z.object({
		name: z.string()
	})
});

export const groups = createTRPCRouter({
	list: protectedProcedure.query(({ ctx: { userId } }) => {
		return prisma.group.findMany({
			where: { ownerId: userId },
			orderBy: { name: 'asc' }
		});
	}),

	create: protectedProcedure.input(GroupCreateWithoutOwnerInputSchema).mutation(
		async ({ input: groupData, ctx: { userId } }) =>
			await prisma.group.create({
				data: { ownerId: userId, ...groupData }
			})
	),
	update: protectedProcedure
		.input(groupUpdateSchema)
		.mutation(async ({ input: { id, data }, ctx: userId }) => {
			await prisma.group.update({ data, where: { id } });
		}),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const group = await prisma.group.findUniqueOrThrow({ where: { id } });

		if (group.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		await prisma.group.delete({ where: { id } });
	})
});
