import { DEFAULT_STRING_DELIMITER, PROPERTIES_WITHOUT_REF } from '$lib/constant/index.js';
import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import {
	aggregatePropertyValue,
	getPropertyDefaultValue,
	getPropertyRef,
	hasRef,
	isBidirectionalRelation,
	isBundle
} from '$lib/trpc/utils';
import { PropertyType, type Item, type Property, type PropertyRef } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const refSchema = z.object({ id: z.string(), value: z.string() });

const itemCreateSchema = z.object({
	name: z.string(),
	collectionId: z.string(),
	properties: z.array(refSchema).optional().default([])
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

	create: protectedProcedure
		.input(itemCreateSchema)
		.mutation(async ({ input }) => await createItem(input)),

	update: protectedProcedure
		.input(itemUpdateSchema)
		.mutation(
			async ({ input: { id, ...rest } }) =>
				await prisma.item.update({ where: { id }, data: { ...rest } })
		),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const item = await prisma.item.findUniqueOrThrow({
			where: { id },
			select: { collection: true }
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
				type: { in: PROPERTIES_WITHOUT_REF }
			}
		})
	]);

	if (properties.length === 0) return items;

	const createdProperties = properties.filter((prop) => prop.type === PropertyType.CREATED);
	const bundleProperties = properties.filter((prop) => isBundle(prop));

	let updItems = [...items];

	for (const property of createdProperties) {
		updItems = updItems.map((item) => injectCreatedRef(item, property.id));
	}

	if (bundleProperties.length === 0) return updItems;

	return await injectBundleRefsItems(updItems, bundleProperties);
}

async function injectBundleRefsItems(items: Item[], properties: Property[]) {
	const extPropertyIds = properties.map((prop) => prop.extTargetProperty);
	const extProperties = await prisma.property.findMany({ where: { id: { in: extPropertyIds } } });

	const extPropertiesMap = new Map<string, Property>();
	for (const property of extProperties) {
		extPropertiesMap.set(property.id, property);
	}

	const allReferencedIds = new Set<string>();
	const bundleProcessingData = properties.map((property) => {
		const itemRefs = items.map((item) => {
			const ref = getPropertyRef(item.properties, property.intTargetProperty);
			const ids = ref ? ref.value.split(DEFAULT_STRING_DELIMITER).filter(Boolean) : [];
			ids.forEach((id) => allReferencedIds.add(id));
			return { item, ids };
		});

		return { property, itemRefs };
	});
	if (allReferencedIds.size === 0) return items;

	const extItems = await prisma.item.findMany({
		where: { id: { in: Array.from(allReferencedIds) } }
	});

	const extItemsMap = new Map<string, Item>();
	for (const item of extItems) {
		extItemsMap.set(item.id, item);
	}

	let updItems = [...items];
	for (const { property, itemRefs } of bundleProcessingData) {
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

async function createItem(args: z.infer<typeof itemCreateSchema>) {
	const properties = await prisma.property.findMany({
		where: { collectionId: args.collectionId },
		orderBy: { order: 'asc' }
	});

	const refs = properties
		.filter((property) => hasRef(property.type))
		.map((property) => ({
			id: property.id,
			value: getPropertyDefaultValue(property)
		}));

	const createdProperties = properties.filter((property) => property.type === PropertyType.CREATED);
	const bundleProperties = properties.filter((property) => isBundle(property));
	const bidirectionalProperties = properties.filter((property) =>
		isBidirectionalRelation(property)
	);

	let item = await prisma.item.create({ data: { ...args, properties: refs } });

	for (const property of createdProperties) {
		item = injectCreatedRef(item, property.id);
	}

	const [_, updatedItem] = await Promise.all([
		bidirectionalProperties.length > 0
			? addCreatedItemToBidirectionalRefs(bidirectionalProperties, item.id)
			: Promise.resolve(),
		bundleProperties.length > 0 ? injectBundleRefs(item, bundleProperties) : Promise.resolve(item)
	]);

	return updatedItem;
}

async function addCreatedItemToBidirectionalRefs(properties: Property[], itemId: string) {
	const extPropertyIds = properties.map((property) => property.relatedProperty);
	const extProperties = await prisma.property.findMany({ where: { id: { in: extPropertyIds } } });

	const extPropertiesMap = new Map<string, Property>();
	for (const property of extProperties) {
		extPropertiesMap.set(property.id, property);
	}

	const allReferencedIds = new Set<string>();
	const processingData = properties.map((property) => {
		const defaultValue = getPropertyDefaultValue(property);
		allReferencedIds.add(defaultValue);
		return { property, defaultValue };
	});

	const items = await prisma.item.findMany({ where: { id: { in: Array.from(allReferencedIds) } } });

	const itemsMap = new Map<string, Item>();
	for (const refItem of items) {
		itemsMap.set(refItem.id, refItem);
	}

	const promises: Promise<any>[] = [];

	for (const { property, defaultValue } of processingData) {
		const relatedProperty = extPropertiesMap.get(property.relatedProperty);
		if (!relatedProperty) continue;

		const refItem = itemsMap.get(defaultValue);
		if (!refItem) continue;

		const ref = getPropertyRef(refItem.properties, relatedProperty.id);
		if (!ref) continue;

		const values = ref.value.split(DEFAULT_STRING_DELIMITER).filter(Boolean);
		values.push(itemId);

		promises.push(
			prisma.item.update({
				where: { id: defaultValue },
				data: {
					properties: {
						updateMany: {
							where: { id: relatedProperty.id },
							data: { value: values.join(DEFAULT_STRING_DELIMITER) }
						}
					}
				}
			})
		);
	}

	return await Promise.all(promises);
}

async function injectBundleRefs(item: Item, properties: Property[]) {
	const extPropertyIds = properties.map((property) => property.extTargetProperty);
	const extProperties = await prisma.property.findMany({ where: { id: { in: extPropertyIds } } });

	const extPropertiesMap = new Map<string, Property>();
	for (const property of extProperties) {
		extPropertiesMap.set(property.id, property);
	}

	const allReferencedIds = new Set<string>();
	const processingData = properties.map((property) => {
		const ref = getPropertyRef(item.properties, property.intTargetProperty!);
		const ids = ref ? ref.value.split(DEFAULT_STRING_DELIMITER).filter(Boolean) : [];
		ids.forEach((id) => allReferencedIds.add(id));
		return { property, ids };
	});

	if (allReferencedIds.size === 0) return item;

	const extItems = await prisma.item.findMany({
		where: { id: { in: Array.from(allReferencedIds) } }
	});

	const extItemsMap = new Map<string, Item>();
	for (const item of extItems) {
		extItemsMap.set(item.id, item);
	}

	for (const { property, ids } of processingData) {
		const extProperty = extPropertiesMap.get(property.extTargetProperty);
		if (!extProperty) continue;

		if (ids.length === 0) {
			item = addRef(item, { id: property.id, value: '' });
			continue;
		}

		const extItems = ids.map((id) => extItemsMap.get(id)!).filter(Boolean);
		const value = aggregatePropertyValue(extItems, property.calculate, extProperty.id);
		item = addRef(item, { id: property.id, value: value.toString() });
	}

	return item;
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
				type: { in: PROPERTIES_WITHOUT_REF }
			}
		})
	]);

	if (properties.length === 0) return item;

	const createdProperties = properties.filter((prop) => prop.type === PropertyType.CREATED);
	const bundleProperties = properties.filter((prop) => isBundle(prop));

	for (const property of createdProperties) {
		item = injectCreatedRef(item, property.id);
	}

	if (bundleProperties.length === 0) return item;

	return await injectBundleRefs(item, bundleProperties);
}

async function updBidirectionalRelationRef(args: { id: string; ref: PropertyRef }) {
	const property = await prisma.property.findUniqueOrThrow({ where: { id: args.ref.id } });
	if (!isBidirectionalRelation(property)) return;

	const storedRefValue = await getStoredRefValue(args.id, args.ref.id);

	const { ids, isDeletion } = getTargetIdsAndMode(storedRefValue, args.ref.value);
	if (ids.length === 0) return;

	const [relatedProperty, items] = await Promise.all([
		prisma.property.findFirstOrThrow({ where: { id: property.relatedProperty } }),
		prisma.item.findMany({ where: { id: { in: ids } } })
	]);

	const updatePromises = items.map((item) => {
		const ref = getPropertyRef(item.properties, relatedProperty.id);
		if (!ref) return null;

		let values = ref.value ? ref.value.split(DEFAULT_STRING_DELIMITER).filter(Boolean) : [];

		if (isDeletion) values = values.filter((v) => v !== args.id);
		else if (!values.includes(args.id)) values.push(args.id);

		return prisma.item.update({
			where: { id: item.id },
			data: {
				properties: {
					updateMany: {
						where: { id: ref.id },
						data: { value: values.join(DEFAULT_STRING_DELIMITER) }
					}
				}
			}
		});
	});

	return await Promise.all(updatePromises.filter(Boolean));
}

async function getStoredRefValue(id: string, refId: string) {
	const item = await prisma.item.findUniqueOrThrow({ where: { id } });

	const ref = item.properties.find((ref) => ref.id === refId);
	return ref ? ref.value : '';
}

function injectCreatedRef(item: Item, pid: string) {
	return addRef(item, { id: pid, value: item.createdAt.toISOString() });
}

function getTargetIdsAndMode(storedRefValue: string, receivedRefValue: string) {
	const storedRefValues = storedRefValue ? storedRefValue.split(DEFAULT_STRING_DELIMITER) : [];
	const receivedRefValues = receivedRefValue
		? receivedRefValue.split(DEFAULT_STRING_DELIMITER)
		: [];

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
