import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { PropertyRefCreateInputSchema } from '$prisma-zod';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const itemCreateSchema = z.object({
	name: z.string(),
	collectionId: z.string(),
	properties: z
		.array(
			z.object({
				id: z.string(),
				value: z.string().optional().default('')
			})
		)
		.optional()
		.default([])
});

const itemUpdateSchema = z.object({
	id: z.string(),
	data: z.object({
		name: z.string().optional(),
		collectionId: z.string().optional(),
		properties: z
			.array(
				z.object({
					id: z.string(),
					value: z.string()
				})
			)
			.optional()
	})
});

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

	createMany: protectedProcedure
		.input(z.array(itemCreateSchema))
		.mutation(async ({ input: items }) => {
			await prisma.item.createMany({
				data: [...items]
			});
		}),

	update: protectedProcedure.input(itemUpdateSchema).mutation(async ({ input: { id, data } }) => {
		return await prisma.item.update({
			data,
			where: { id }
		});
	}),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const item = await prisma.item.findUniqueOrThrow({
			select: { collection: true },
			where: { id }
		});
		if (item.collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		await prisma.item.delete({ where: { id } });
	}),
	addProperty: protectedProcedure
		.input(z.object({ ids: z.array(z.string()), property: PropertyRefCreateInputSchema }))
		.mutation(async ({ input: { ids, property } }) => {
			await prisma.item.updateMany({
				data: { properties: { push: property } },
				where: { id: { in: ids } }
			});
		}),
	updateProperty: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				property: z.object({ id: z.string(), value: z.string() })
			})
		)
		.mutation(async ({ input: { id, property } }) => {
			const { id: pid, ...rest } = property;

			return await prisma.item.update({
				where: { id },
				data: {
					properties: { updateMany: { where: { id: pid }, data: rest } }
				}
			});
		}),
	deleteProperty: protectedProcedure
		.input(z.object({ ids: z.array(z.string()), propertyId: z.string() }))
		.mutation(async ({ input: { ids, propertyId } }) => {
			await prisma.$transaction(
				ids.map((id) =>
					prisma.item.update({
						data: {
							properties: {
								deleteMany: {
									where: { id: propertyId }
								}
							}
						},
						where: { id }
					})
				)
			);
		})
});
