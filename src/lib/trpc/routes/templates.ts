import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { z } from 'zod';
import { duplicateCollection } from './collections';

export const templates = createTRPCRouter({
	list: protectedProcedure.query(async () => await listTemplates()),
	load: protectedProcedure.input(z.string()).query(async ({ input }) => await loadTemplate(input)),
	turn: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
		return await turnTemplateIntoCollection(input, ctx.userId);
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
		include: {
			items: true,
			properties: { include: { options: true } }
		}
	});
}

async function turnTemplateIntoCollection(id: string, userId: string) {
	const result = await duplicateCollection(id, userId);

	if (result) {
		await prisma.collection.update({
			where: { id },
			data: { templateUsageCount: { increment: 1 } }
		});
	}

	return result;
}
