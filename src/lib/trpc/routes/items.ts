import {
	DEFAULT_STRING_DELIMITER,
	NAME_FIELD,
	PROPERTIES_WITH_LISTABLE_OPTIONS,
	PROPERTIES_WITHOUT_REF
} from '$lib/constant/index.js';
import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import {
	aggregatePropertyValue,
	compareValues,
	getPropertyDefaultValue,
	getPropertyOption,
	getPropertyRef,
	hasRef,
	isBidirectionalRelation,
	isBundleValueInjectable
} from '$lib/trpc/utils';
import {
	PropertyType,
	SortType,
	type Item,
	type Property,
	type PropertyRef,
	type Sort
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const itemListSchema = z.object({
	collectionId: z.string(),
	viewShortId: z.number()
});

const itemCreateSchema = z.object({
	name: z.string(),
	collectionId: z.string()
});

const itemUpdateSchema = itemCreateSchema
	.extend({ id: z.string() })
	.partial({ name: true, collectionId: true });

const refUpdateSchema = z.object({
	id: z.string(),
	cid: z.string(),
	ref: z.object({ id: z.string(), value: z.string() })
});

export const items = createTRPCRouter({
	list: protectedProcedure.input(itemListSchema).query(async ({ input }) => await listItems(input)),

	search: protectedProcedure.query(async ({ ctx: { userId } }) => await listSearchableItem(userId)),

	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findUnique({ where: { id: input } })),

	create: protectedProcedure
		.input(itemCreateSchema)
		.mutation(async ({ input }) => await createItem(input)),

	duplicate: protectedProcedure
		.input(z.string())
		.mutation(async ({ input }) => await duplicateItem(input)),

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

async function listItems(args: z.infer<typeof itemListSchema>) {
	const { collectionId, viewShortId } = args;

	const view = await prisma.view.findFirstOrThrow({
		where: { collectionId, shortId: viewShortId }
	});

	const sortIds = view.sorts.filter((s) => s.field !== NAME_FIELD).map((s) => s.field);

	const [items, properties] = await Promise.all([
		prisma.item.findMany({
			where: {
				collectionId,
				...(view.filters.length > 0 && {
					AND: view.filters.map((filter) => ({
						properties: {
							some: {
								id: filter.id,
								OR: filter.values.map((value) => ({
									value: { contains: value }
								}))
							}
						}
					}))
				})
			}
		}),
		prisma.property.findMany({
			where: {
				collectionId,
				OR: [{ type: { in: PROPERTIES_WITHOUT_REF } }, { id: { in: sortIds } }]
			}
		})
	]);

	if (properties.length === 0) return sortItems(items, view.sorts, properties);

	const createdProperties = properties.filter((prop) => prop.type === PropertyType.CREATED);
	const bundleProperties = properties.filter((prop) => isBundleValueInjectable(prop));

	let updItems = [...items];

	for (const property of createdProperties) {
		updItems = updItems.map((item) => injectCreatedRef(item, property.id));
	}

	if (bundleProperties.length === 0) return sortItems(updItems, view.sorts, properties);

	updItems = await injectBundleRefsItems(updItems, bundleProperties);

	return sortItems(updItems, view.sorts, properties);
}

async function injectBundleRefsItems(items: Item[], properties: Property[]) {
	const extPropertyIds = properties.map((prop) => prop.extTargetProperty!);
	const extProperties = await prisma.property.findMany({ where: { id: { in: extPropertyIds } } });

	const extPropertiesMap = new Map<string, Property>();
	for (const property of extProperties) {
		extPropertiesMap.set(property.id, property);
	}

	const allReferencedIds = new Set<string>();
	const processingData = properties.map((property) => {
		const itemRefs = items.map((item) => {
			const ref = getPropertyRef(item.properties, property.intTargetProperty!);
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

	const updates = new Map<string, Item>();

	for (const { property, itemRefs } of processingData) {
		const extProperty = extPropertiesMap.get(property.extTargetProperty!);
		if (!extProperty) continue;

		itemRefs.forEach(({ item, ids }) => {
			const key = item.id;

			if (!updates.has(key)) {
				updates.set(key, item);
			}

			let ref = { id: property.id, value: '' };

			if (ids.length !== 0 && property.calculate) {
				const extItems = ids.map((id) => extItemsMap.get(id)!).filter(Boolean);
				ref.value = aggregatePropertyValue(extItems, property.calculate, extProperty.id).toString();
			}

			updates.set(key, addRef(updates.get(key)!, ref));
		});
	}

	return Array.from(updates.values());
}

function sortItems(items: Item[], sorts: Sort[], properties: Property[]) {
	if (sorts.length === 0) return items;

	const propertiesMap = new Map<string, Property>(properties.map((p) => [p.id, p]));

	return items.sort((a, b) => {
		for (const sort of sorts) {
			let aValue, bValue;

			if (sort.field === NAME_FIELD) {
				aValue = a.name;
				bValue = b.name;
			} else {
				aValue = getPropertyRef(a.properties, sort.field)?.value || '';
				bValue = getPropertyRef(b.properties, sort.field)?.value || '';
				const property = propertiesMap.get(sort.field);
				if (property && PROPERTIES_WITH_LISTABLE_OPTIONS.includes(property.type)) {
					aValue = getPropertyOption(property.options, aValue)?.value || '';
					bValue = getPropertyOption(property.options, bValue)?.value || '';
				}
			}

			const compare = compareValues(aValue, bValue);
			if (compare !== 0) return sort.order === SortType.ASC ? compare : -compare;
		}

		return 0;
	});
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
			value: getPropertyDefaultValue(property) || ''
		}));

	const createdProperties = properties.filter((property) => property.type === PropertyType.CREATED);
	const bundleProperties = properties.filter((property) => isBundleValueInjectable(property));
	const bidirectionalProperties = properties.filter(
		(property) => isBidirectionalRelation(property) && property.defaultValue != null
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
	const extPropertyIds = properties.map((property) => property.relatedProperty!);
	const extProperties = await prisma.property.findMany({ where: { id: { in: extPropertyIds } } });

	const extPropertiesMap = new Map<string, Property>();
	for (const property of extProperties) {
		extPropertiesMap.set(property.id, property);
	}

	const allReferencedIds = new Set<string>();
	const processingData = properties.map((property) => {
		const defaultValue = getPropertyDefaultValue(property) || '';
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
		const relatedProperty = extPropertiesMap.get(property.relatedProperty!);
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
	const extPropertyIds = properties.map((property) => property.extTargetProperty!);
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
		const extProperty = extPropertiesMap.get(property.extTargetProperty!);
		if (!extProperty) continue;

		if (ids.length === 0 || !property.calculate) {
			item = addRef(item, { id: property.id, value: '' });
			continue;
		}

		const extItems = ids.map((id) => extItemsMap.get(id)!).filter(Boolean);
		const value = aggregatePropertyValue(extItems, property.calculate, extProperty.id);
		item = addRef(item, { id: property.id, value: value.toString() });
	}

	return item;
}

async function duplicateItem(id: string) {
	const target = await prisma.item.findUniqueOrThrow({ where: { id } });
	const properties = await prisma.property.findMany({
		where: { collectionId: target.collectionId }
	});

	const { id: _1, createdAt: _2, updatedAt: _3, ...rest } = target;
	const createdProperties = properties.filter((property) => property.type === PropertyType.CREATED);
	const bundleProperties = properties.filter((property) => isBundleValueInjectable(property));
	const bidirectionalProperties = properties.filter((property) =>
		isBidirectionalRelation(property)
	);

	let item = await prisma.item.create({
		data: {
			...rest,
			name: rest.name + ' copy'
		}
	});

	for (const property of createdProperties) {
		item = injectCreatedRef(item, property.id);
	}

	const [_b, updatedItem] = await Promise.all([
		bidirectionalProperties.length > 0
			? addCreatedItemToBidirectionalRefs(bidirectionalProperties, item.id)
			: Promise.resolve(),
		bundleProperties.length > 0 ? injectBundleRefs(item, bundleProperties) : Promise.resolve(item)
	]);

	return updatedItem;
}

async function updateRef(args: z.infer<typeof refUpdateSchema>) {
	const [targetProperty, injectableProperties] = await Promise.all([
		prisma.property.findUniqueOrThrow({ where: { id: args.ref.id } }),
		prisma.property.findMany({
			where: { collectionId: args.cid, type: { in: PROPERTIES_WITHOUT_REF } }
		})
	]);

	if (isBidirectionalRelation(targetProperty)) {
		await updBidirectionalRelationRef(targetProperty, args.id, args.ref.value);
	}

	let item = await prisma.item.update({
		where: { id: args.id },
		data: {
			properties: {
				updateMany: { where: { id: args.ref.id }, data: { value: args.ref.value } }
			}
		}
	});

	if (injectableProperties.length === 0) return item;

	const createdProperties = injectableProperties.filter(
		(property) => property.type === PropertyType.CREATED
	);
	const bundleProperties = injectableProperties.filter((property) =>
		isBundleValueInjectable(property)
	);

	for (const property of createdProperties) {
		item = injectCreatedRef(item, property.id);
	}

	if (bundleProperties.length === 0) return item;

	return await injectBundleRefs(item, bundleProperties);
}

async function updBidirectionalRelationRef(property: Property, id: string, refValue: string) {
	const storedItem = await prisma.item.findUniqueOrThrow({ where: { id: id } });
	const ref = storedItem.properties.find((ref) => ref.id === property.id);
	const storedRefValue = ref ? ref.value : '';

	const { ids, isDeletion } = getTargetIdsAndMode(storedRefValue, refValue);
	if (ids.length === 0) return;

	const items = await prisma.item.findMany({ where: { id: { in: ids } } });

	const updatePromises = items.map((item) => {
		const ref = getPropertyRef(item.properties, property.relatedProperty!);
		if (!ref) return null;

		let values = ref.value ? ref.value.split(DEFAULT_STRING_DELIMITER).filter(Boolean) : [];

		if (isDeletion) values = values.filter((v) => v !== storedItem.id);
		else if (!values.includes(storedItem.id)) values.push(storedItem.id);

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

function getTargetIdsAndMode(storedValue: string, receivedValue: string) {
	const storedValues = storedValue
		? storedValue.split(DEFAULT_STRING_DELIMITER).filter(Boolean)
		: [];
	const receivedValues = receivedValue
		? receivedValue.split(DEFAULT_STRING_DELIMITER).filter(Boolean)
		: [];

	const storedSet = new Set(storedValues);
	const receivedSet = new Set(receivedValues);

	const isDeletion = storedValues.length > receivedValues.length;

	const ids = isDeletion
		? storedValues.filter((v) => !receivedSet.has(v))
		: receivedValues.filter((v) => !storedSet.has(v));

	return { ids, isDeletion };
}

function injectCreatedRef(item: Item, pid: string) {
	return addRef(item, { id: pid, value: item.createdAt.toISOString() });
}

function addRef(item: Item, ref: PropertyRef) {
	return { ...item, properties: [...item.properties, { ...ref }] };
}
