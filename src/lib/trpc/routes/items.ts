import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const propertyRefSchema = z.object({ id: z.string(), value: z.string() });

const itemCreateSchema = z.object({
	name: z.string(),
	collectionId: z.string(),
	properties: z.array(propertyRefSchema).optional()
});

const itemUpdateSchema = itemCreateSchema
	.merge(z.object({ id: z.string() }))
	.partial({ name: true, collectionId: true });

const propertyUpdateSchema = z.object({ id: z.string(), property: propertyRefSchema });

export const items = createTRPCRouter({
	list: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findMany({ where: { collectionId: input } })),

	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findUnique({ where: { id: input } })),

	create: protectedProcedure.input(itemCreateSchema).mutation(async ({ input: item }) => {
		return await prisma.item.create({
			data: { ...item }
		});
	}),

	update: protectedProcedure.input(itemUpdateSchema).mutation(
		async ({ input: { id, ...rest } }) =>
			await prisma.item.update({
				where: { id },
				data: { ...rest }
			})
	),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const item = await prisma.item.findUniqueOrThrow({
			select: { collection: true },
			where: { id }
		});
		if (item.collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		await prisma.item.delete({ where: { id } });
	}),

	updateProperty: protectedProcedure
		.input(propertyUpdateSchema)
		.mutation(async ({ input: { id, property } }) => {
			const { id: pid, ...rest } = property;

			return await prisma.item.update({
				where: { id },
				data: {
					properties: { updateMany: { where: { id: pid }, data: rest } }
				}
			});
		})
});
