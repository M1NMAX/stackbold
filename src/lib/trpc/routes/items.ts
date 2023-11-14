import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import {
	ItemCreateWithoutCollectionInputSchema,
	ItemPropertyCreateInputSchema,
	ItemUpdateInputSchema
} from '$prisma-zod';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const items = createTRPCRouter({
	list: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findMany({ where: { collectionId: input } })),

	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findUnique({ where: { id: input } })),

	create: protectedProcedure
		.input(z.object({ collectionId: z.string(), itemData: ItemCreateWithoutCollectionInputSchema }))
		.mutation(async ({ input: { collectionId, itemData } }) => {
			return await prisma.item.create({
				data: { ...itemData, collection: { connect: { id: collectionId } } }
			});
		}),

	update: protectedProcedure
		.input(z.object({ id: z.string(), data: ItemUpdateInputSchema }))
		.mutation(async ({ input: { id, data }, ctx: { userId } }) => {
			Object.assign(data, { updatedByUserId: userId });

			await prisma.item.update({
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
		.input(z.object({ ids: z.array(z.string()), property: ItemPropertyCreateInputSchema }))
		.mutation(async ({ input: { ids, property }, ctx: { userId } }) => {
			//TODO: find better alt
			for (const id of ids) {
				await prisma.item.update({
					data: { properties: { push: [property] } },
					where: { id }
				});
			}
		}),
	updateProperty: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				property: z.object({ id: z.string(), value: z.string() })
			})
		)
		.mutation(async ({ input: { id, property }, ctx: { userId } }) => {
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
		.mutation(async ({ input: { ids, propertyId }, ctx: { userId } }) => {
			//TODO: find better alt
			for (const id of ids) {
				await prisma.item.update({
					data: { properties: { deleteMany: { where: { id: propertyId } } } },
					where: { id }
				});
			}
		})
});
