import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { CollectionCreateWithoutOwnerInputSchema } from '$prisma-zod';

export const collections = createTRPCRouter({
	getUserCollections: protectedProcedure.query(({ ctx: { userId } }) =>
		prisma.collection.findMany({
			where: { ownerId: userId },
			orderBy: { createdAt: 'asc' }
		})
	),
	getCollection: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.collection.findUniqueOrThrow({ where: { id: input } })),

	createCollection: protectedProcedure.input(CollectionCreateWithoutOwnerInputSchema).mutation(
		async ({ input: collectionData, ctx: { userId } }) =>
			await prisma.collection.create({
				data: { ownerId: userId, ...collectionData }
			})
	),

	deleteCollection: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId } }) => {
			const collection = await prisma.collection.findUniqueOrThrow({ where: { id } });

			if (collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

			await prisma.collection.delete({ where: { id } });
		})
});
