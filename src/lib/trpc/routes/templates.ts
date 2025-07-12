import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { z } from 'zod';
import { PropertyType } from '@prisma/client';

export const templates = createTRPCRouter({
	list: protectedProcedure.query(() => prisma.template.findMany({ orderBy: { createdAt: 'asc' } })),
	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.template.findUniqueOrThrow({ where: { id: input } })),

	turn: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId } }) => turnTemplateIntoCollection(id, userId))
});

async function turnTemplateIntoCollection(id: string, userId: string) {
	const template = await prisma.template.findUniqueOrThrow({
		where: { id }
	});

	const { id: _, items, properties: tProperties, ...rest } = template;

	const collection = await prisma.collection.create({
		data: { ownerId: userId, ...rest }
	});

	const propertiesData = tProperties.map(({ id, ...rest }) => ({
		...rest,
		collectionId: collection.id
	}));

	await prisma.property.createMany({ data: propertiesData });

	const properties = await prisma.property.findMany({
		where: {
			collectionId: collection.id,
			type: { notIn: [PropertyType.BUNDLE, PropertyType.CREATED] }
		},
		orderBy: { order: 'asc' }
	});

	const itemData = items.map(({ id, ...rest }) => {
		let refs = [];

		for (let i = 0; i < properties.length; i++) {
			refs.push({ id: properties[i].id, value: rest.properties[i].value });
		}

		return {
			...rest,
			collectionId: collection.id,
			properties: refs
		};
	});

	await prisma.item.createMany({ data: itemData });

	return collection;
}
