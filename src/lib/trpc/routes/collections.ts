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

	createCollection: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(50)
			})
		)
		.mutation(async ({ input, ctx: { userId } }) => {
			await prisma.collection.create({
				data: { ownerId: userId, name: input.name }
			});
		}),

	deleteCollection: protectedProcedure.input(z.string()).mutation(async ({ input: id }) => {
		await prisma.collection.delete({ where: { id } });
	})
});
