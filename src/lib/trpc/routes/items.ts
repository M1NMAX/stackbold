import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { aggregatePropertyValue, getPropertyRef, isRelation } from '$lib/trpc/utils';
import { PropertyType, type Item, type Property, type PropertyRef } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const refSchema = z.object({ id: z.string(), value: z.string() });

const itemCreateSchema = z.object({
	name: z.string(),
	collectionId: z.string(),
	properties: z.array(refSchema).optional()
});

const itemUpdateSchema = itemCreateSchema
	.merge(z.object({ id: z.string() }))
	.partial({ name: true, collectionId: true });

const refUpdateSchema = z.object({ id: z.string(), cid: z.string(), ref: refSchema });

export const items = createTRPCRouter({
	list: protectedProcedure.input(z.string()).query(async ({ input }) => await listItems(input)),

	search: protectedProcedure.query(async ({ ctx: { userId } }) => await listSearchableItem(userId)),

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

	updateRef: protectedProcedure
		.input(refUpdateSchema)
		.mutation(async ({ input }) => await updateRef(input))
});

async function listItems(cid: string) {
	const [items, properties] = await Promise.all([
		prisma.item.findMany({ where: { collectionId: cid } }),
		prisma.property.findMany({
			where: {
				OR: [{ type: PropertyType.BUNDLE }, { type: PropertyType.CREATED }],
				AND: { collectionId: cid }
			}
		})
	]);

	if (properties.length === 0) return items;

	let updItems = [...items];
	for (const property of properties) {
		if (property.type === PropertyType.CREATED) {
			updItems = injectCreatedRef(updItems, property);
		} else if (property.type === PropertyType.BUNDLE) {
			updItems = await injectBundleValue(updItems, property);
		}
	}
	return updItems;
}

async function listSearchableItem(userId: string) {
	return await prisma.item.findMany({
		where: { collection: { ownerId: userId } },
		select: {
			id: true,
			name: true,
			updatedAt: true,
			collection: { select: { id: true, name: true } }
		}
	});
}

async function updBidirectionalRelationRef(args: { id: string; ref: PropertyRef }) {
	const { id, ref } = args;

	const property = await prisma.property.findUniqueOrThrow({ where: { id: ref.id } });
	if (!isRelation(property) || !property.relatedProperty) return;

	const storedRefValue = await getStoredRefValue(id, ref.id);

	const { ids, isDeletion } = getTargetIdsAndMode(storedRefValue, ref.value);
	if (ids.length === 0) return;

	const [relatedProperty, items] = await Promise.all([
		prisma.property.findFirstOrThrow({
			where: { id: property.relatedProperty, type: PropertyType.RELATION }
		}),
		prisma.item.findMany({ where: { id: { in: ids } } })
	]);

	const updatePromises = items.map((item) => {
		const innerRef = getPropertyRef(item.properties, relatedProperty.id);
		if (!innerRef) return null;

		let values = innerRef.value ? innerRef.value.split('|') : [];

		if (isDeletion) values = values.filter((v) => v !== id);
		else if (!values.includes(id)) values.push(id);

		return prisma.item.update({
			where: { id: item.id },
			data: {
				properties: {
					updateMany: {
						where: { id: innerRef.id },
						data: { value: values.join('|') }
					}
				}
			}
		});
	});

	return await Promise.all(updatePromises.filter((p) => p != null));
}

async function getStoredRefValue(itemId: string, refId: string) {
	const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });

	const ref = item.properties.find((ref) => ref.id === refId);
	if (!ref) throw new Error('Unable to find ref ' + refId);

	return ref.value;
}

async function injectBundleValue(items: Item[], property: Property) {
	if (!property.extTargetProperty || !property.intTargetProperty) return items;

	const extProperty = await prisma.property.findUnique({
		where: { id: property.extTargetProperty }
	});

	if (!extProperty) return items;

	return await Promise.all(
		items.map(async (item) => {
			const ref = getPropertyRef(item.properties, property.intTargetProperty);
			if (!ref) return addRef(item, { id: property.id, value: '' });

			const ids = ref.value ? ref.value.split('|') : [];
			if (ids.length === 0) return addRef(item, { id: property.id, value: '' });

			const extItems = await prisma.item.findMany({ where: { id: { in: ids } } });
			const value = aggregatePropertyValue(extItems, property.calculate, extProperty.id);

			return addRef(item, { id: property.id, value: value.toString() });
		})
	);
}

async function updateRef(args: z.infer<typeof refUpdateSchema>) {
	const { id: pid, ...rest } = args.ref;

	let [_, item, properties] = await Promise.all([
		updBidirectionalRelationRef({ id: args.id, ref: args.ref }),
		prisma.item.update({
			where: { id: args.id },
			data: {
				properties: {
					updateMany: { where: { id: pid }, data: rest }
				}
			}
		}),
		prisma.property.findMany({
			where: {
				OR: [{ type: PropertyType.BUNDLE }, { type: PropertyType.CREATED }],
				AND: { collectionId: args.cid }
			}
		})
	]);

	if (properties.length === 0) return item;

	for (const property of properties) {
		if (property.type === PropertyType.CREATED) {
			item = addRef(item, { id: property.id, value: item.createdAt.toISOString() });
		} else if (property.type === PropertyType.BUNDLE) {
			if (!property.extTargetProperty || !property.intTargetProperty) continue;

			const extProperty = await prisma.property.findUnique({
				where: { id: property.extTargetProperty }
			});

			if (!extProperty) continue;

			const ref = getPropertyRef(item.properties, property.intTargetProperty);
			if (!ref) {
				item = addRef(item, { id: property.id, value: '' });
				continue;
			}

			const ids = ref.value ? ref.value.split('|') : [];
			if (ids.length === 0) {
				item = addRef(item, { id: property.id, value: '' });
				continue;
			}

			const extItems = await prisma.item.findMany({ where: { id: { in: ids } } });
			const value = aggregatePropertyValue(extItems, property.calculate, extProperty.id);

			item = addRef(item, { id: property.id, value: value.toString() });
		}
	}

	return item;
}

function injectCreatedRef(items: Item[], property: Property) {
	return items.map((item) =>
		addRef(item, { id: property.id, value: item.createdAt.toISOString() })
	);
}

function getTargetIdsAndMode(storedRefValue: string, receivedRefValue: string) {
	const storedRefValues = storedRefValue ? storedRefValue.split('|') : [];
	const receivedRefValues = receivedRefValue ? receivedRefValue.split('|') : [];

	const storedSet = new Set(storedRefValues);
	const receivedSet = new Set(receivedRefValues);

	const isDeletion = storedRefValues.length > receivedRefValues.length;

	const ids = isDeletion
		? storedRefValues.filter((v) => !receivedSet.has(v))
		: receivedRefValues.filter((v) => !storedSet.has(v));

	return { ids, isDeletion };
}

function addRef(item: Item, ref: PropertyRef) {
	return { ...item, properties: [...item.properties, { id: ref.id, value: ref.value }] };
}
