import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { z } from 'zod';

export const templates = createTRPCRouter({
	list: protectedProcedure.query(() => prisma.template.findMany({ orderBy: { createdAt: 'asc' } })),
	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.template.findUniqueOrThrow({ where: { id: input } })),

	turn: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const { items, properties, ...rest } = await prisma.template.findFirstOrThrow({
			where: { id }
		});

		const collection = await prisma.collection.create({
			data: { ownerId: userId, ...rest }
		});

		const props = await Promise.all(
			properties.map(async ({ id, ...rest }) => {
				const result = await prisma.property.create({
					data: { ...rest, collectionId: collection.id }
				});
				return { ...result, old: id };
			})
		);

		const collectionItems = items.map(({ id, ...rest }) => {
			const properties = props
				.filter((prop) => prop.type !== 'CREATED')
				.map((prop) => {
					const ref = rest.properties.find((ref) => ref.id === prop.old);
					if (!ref) return { id: prop.id, value: '' };
					return { id: prop.id, value: ref.value };
				});

			return {
				...rest,
				collectionId: collection.id,
				properties
			};
		});

		await prisma.item.createMany({ data: collectionItems });

		return collection;
	})
});
