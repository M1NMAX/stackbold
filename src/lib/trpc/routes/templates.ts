import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { z } from 'zod';
import { duplicateCollection } from './collections';

export const templates = createTRPCRouter({
	list: protectedProcedure.query(async () => await listTemplates()),
	load: protectedProcedure.input(z.string()).query(async ({ input }) => await loadTemplate(input)),
	turn: protectedProcedure.input(z.string()).mutation(async ({ input, ctx: { userId } }) => {
		return await duplicateCollection(input, userId);
	})
});

async function listTemplates() {
	return await prisma.collection.findMany({
		where: { isTemplate: true },
		orderBy: { createdAt: 'asc' }
	});
}
async function loadTemplate(id: string) {
	return await prisma.collection.findUniqueOrThrow({
		where: { id },
		include: { properties: true, items: true }
	});
}
