import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { View } from '@prisma/client';

const viewSchema = z.nativeEnum(View);

const groupByConfigSchema = z.object({
	view: viewSchema,
	propertyId: z.string()
});

const filterConfigsSchema = z.object({
	view: viewSchema,
	filters: z.array(
		z.object({
			id: z.string(),
			values: z.array(z.string())
		})
	)
});

const defaultGroupByConfigs = [
	{ view: View.LIST, propertyId: '' },
	{ view: View.TABLE, propertyId: '' }
];

const defaultFilterConfigs = [
	{ view: View.LIST, filters: [] },
	{ view: View.TABLE, filters: [] }
];

const collectionCreateSchema = z.object({
	icon: z.string().optional(),
	name: z.string(),
	isPinned: z.boolean().optional(),
	description: z.string().optional(),
	isDescHidden: z.boolean().optional(),
	groupId: z.string().nullable().optional(),
	groupByConfigs: z.array(groupByConfigSchema).optional().default(defaultGroupByConfigs),
	filterConfigs: z.array(filterConfigsSchema).optional().default(defaultFilterConfigs)
});

const collectionUpdateSchema = collectionCreateSchema
	.merge(
		z.object({
			id: z.string(),
			groupByConfigs: z.array(groupByConfigSchema).optional(),
			filterConfigs: z.array(filterConfigsSchema).optional()
		})
	)
	.partial({ name: true });

export const collections = createTRPCRouter({
	list: protectedProcedure.query(({ ctx: { userId } }) =>
		prisma.collection
			.findMany({
				where: { ownerId: userId },
				orderBy: { createdAt: 'asc' },
				include: { _count: { select: { items: true } } }
			})
			.then((collections) =>
				collections.map(({ _count: { items }, ...rest }) => ({ nItems: items, ...rest }))
			)
	),
	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.collection.findUniqueOrThrow({ where: { id: input } })),

	create: protectedProcedure.input(collectionCreateSchema).mutation(
		async ({ input: collectionData, ctx: { userId } }) =>
			await prisma.collection.create({
				data: { ownerId: userId, ...collectionData }
			})
	),

	duplicate: protectedProcedure.input(z.string()).mutation(async ({ input: id }) => {
		const {
			id: _,
			properties,
			items,
			...rest
		} = await prisma.collection.findFirstOrThrow({
			where: { id },
			include: { items: true, properties: true }
		});

		const collection = await prisma.collection.create({
			data: { ...rest, name: rest.name + ' copy' }
		});

		const props = await Promise.all(
			properties.map(async ({ id, ...rest }) => {
				const result = await prisma.property.create({
					data: { ...rest, collectionId: collection.id }
				});
				return { ...result, old: id };
			})
		);

		if (items.length > 0) {
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
		}

		return collection;
	}),

	update: protectedProcedure
		.input(collectionUpdateSchema)
		.mutation(
			async ({ input: { id, ...rest } }) =>
				await prisma.collection.update({ where: { id }, data: { ...rest } })
		),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const collection = await prisma.collection.findUniqueOrThrow({ where: { id } });

		if (collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		await prisma.collection.delete({ where: { id } });
	})
});
