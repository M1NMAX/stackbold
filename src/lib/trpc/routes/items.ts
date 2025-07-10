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

	create: protectedProcedure.input(itemCreateSchema).mutation(
		async ({ input: item }) =>
			await prisma.item.create({
				data: { ...item }
			})
	),

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
				collectionId: cid,
				type: { in: [PropertyType.BUNDLE, PropertyType.CREATED] }
			}
		})
	]);

	if (properties.length === 0) return items;

	const createdProps = properties.filter((prop) => prop.type === PropertyType.CREATED);
	const bundleProps = properties.filter((prop) => prop.type === PropertyType.BUNDLE);

	let updItems = [...items];

	for (const property of createdProps) {
		updItems = injectCreatedRef(updItems, property);
	}

	if (bundleProps.length === 0) return updItems;

	return await processBundleProperties(updItems, bundleProps);
}

async function processBundleProperties(items: Item[], properties: Property[]) {
	const extPropertyIds = properties
		.map((prop) => prop.extTargetProperty)
		.filter(Boolean) as string[];

	const extPropertiesMap = new Map<string, Property>();
	if (extPropertyIds.length > 0) {
		const extProperties = await prisma.property.findMany({ where: { id: { in: extPropertyIds } } });

		for (const property of extProperties) {
			extPropertiesMap.set(property.id, property);
		}
	}

	const allReferencedIds = new Set<string>();
	const bundleProcessingData = properties
		.map((property) => {
			if (!property.intTargetProperty) return null;

			const itemRefs = items.map((item) => {
				const ref = getPropertyRef(item.properties, property.intTargetProperty);
				const ids = ref?.value ? ref.value.split('|').filter(Boolean) : [];
				ids.forEach((id) => allReferencedIds.add(id));
				return { item, ids };
			});

			return { property, itemRefs };
		})
		.filter(Boolean);

	const extItemsMap = new Map<string, Item>();
	if (allReferencedIds.size > 0) {
		const extItems = await prisma.item.findMany({
			where: { id: { in: Array.from(allReferencedIds) } }
		});
		for (const item of extItems) {
			extItemsMap.set(item.id, item);
		}
	}

	let updItems = items;
	for (const data of bundleProcessingData) {
		if (!data) continue;

		const { property, itemRefs } = data;

		if (!property.extTargetProperty || !property.intTargetProperty) continue;

		const extProperty = extPropertiesMap.get(property.extTargetProperty);
		if (!extProperty) continue;

		updItems = itemRefs.map(({ item, ids }) => {
			if (ids.length === 0) return addRef(item, { id: property.id, value: '' });

			const extItems = ids.map((id) => extItemsMap.get(id)!).filter(Boolean);
			const value = aggregatePropertyValue(extItems, property.calculate, extProperty.id);
			return addRef(item, { id: property.id, value: value.toString() });
		});
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
				collectionId: args.cid,
				type: { in: [PropertyType.BUNDLE, PropertyType.CREATED] }
			}
		})
	]);

	if (properties.length === 0) return item;

	const createdProps = properties.filter((prop) => prop.type === PropertyType.CREATED);
	const bundleProps = properties.filter(
		(prop) => prop.type === PropertyType.BUNDLE && prop.extTargetProperty && prop.intTargetProperty
	);

	for (const property of createdProps) {
		item = addRef(item, { id: property.id, value: item.createdAt.toISOString() });
	}

	if (bundleProps.length === 0) return item;

	const extPropertyIds = bundleProps.map((prop) => prop.extTargetProperty);
	const extPropertiesMap = new Map<string, Property>();

	if (extPropertyIds.length > 0) {
		const extProperties = await prisma.property.findMany({ where: { id: { in: extPropertyIds } } });

		for (const property of extProperties) {
			extPropertiesMap.set(property.id, property);
		}
	}

	const allReferencedIds = new Set<string>();
	const bundleProcessingData = bundleProps.map((property) => {
		const ref = getPropertyRef(item.properties, property.intTargetProperty!);
		const ids = ref?.value ? ref.value.split('|').filter(Boolean) : [];
		ids.forEach((id) => allReferencedIds.add(id));
		return { property, ref, ids };
	});

	const extItemsMap = new Map<string, Item>();
	if (allReferencedIds.size > 0) {
		const extItems = await prisma.item.findMany({
			where: { id: { in: Array.from(allReferencedIds) } }
		});

		for (const item of extItems) {
			extItemsMap.set(item.id, item);
		}
	}

	for (const { property, ref, ids } of bundleProcessingData) {
		const extProperty = extPropertiesMap.get(property.extTargetProperty);
		if (!extProperty) continue;

		if (!ref || ids.length === 0) {
			item = addRef(item, { id: property.id, value: '' });
			continue;
		}

		const extItems = ids.map((id) => extItemsMap.get(id)).filter(Boolean) as Item[];
		const value = aggregatePropertyValue(extItems, property.calculate, extProperty.id);
		item = addRef(item, { id: property.id, value: value.toString() });
	}

	return item;
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
