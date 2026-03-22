import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { groupBy, hasRef, isBidirectionalRelation, isBundle, isRelation } from '$lib/trpc/utils';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
	Aggregator,
	Color,
	PropertyType,
	type Item,
	type Property,
	type View
} from '@prisma/client';
import { listObjects, removeObjects } from '$lib/server/minio';
import { GROUPABLE_PROPERTY_TYPES, NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS } from '$lib/constant';
import type { PropertyWithOptions, XPropertyOption } from '$lib/types';

const colorSchema = z.enum(Color);
const propertyTypeSchema = z.enum(PropertyType);
const aggregatorSchema = z.enum(Aggregator);

const optionSchema = z.object({
	id: z.string(),
	value: z.string(),
	color: colorSchema
});

const propertyCreateSchema = z.object({
	collectionId: z.string(),
	name: z.string(),
	type: propertyTypeSchema.optional(),
	options: z.array(optionSchema).optional(),
	order: z.number().optional(),
	aggregator: aggregatorSchema.nullish(),
	defaultValue: z.string().nullish(),
	targetCollection: z.string().nullish(),
	relatedProperty: z.string().nullish(),
	intTargetProperty: z.string().nullish(),
	extTargetProperty: z.string().nullish(),
	calculate: aggregatorSchema.nullish(),
	format: z.string().nullish(),
	decimals: z.number().min(0).max(5).nullish()
});

const propertyUpdateSchema = propertyCreateSchema
	.extend({ id: z.string() })
	.partial({ collectionId: true, name: true });

const propertyOrderSchema = z.object({
	collectionId: z.string(),
	start: z.number(),
	end: z.number()
});

const propertyOptionCreateSchema = z.object({
	propertyId: z.string(),
	value: z.string()
});

const propertyOptionUpdateSchema = propertyOptionCreateSchema
	.extend({ id: z.string(), color: colorSchema.optional() })
	.partial({
		propertyId: true,
		value: true,
		color: true
	});

const propertyOptionOrderSchema = z.object({
	propertyId: z.string(),
	start: z.number(),
	end: z.number()
});

export const properties = createTRPCRouter({
	list: protectedProcedure
		.input(z.string())
		.query(async ({ input }) => await listProperties(input)),

	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.property.findUnique({ where: { id: input } })),

	create: protectedProcedure
		.input(propertyCreateSchema)
		.mutation(async ({ input }) => await createProperty(input)),

	update: protectedProcedure
		.input(propertyUpdateSchema)
		.mutation(async ({ input }) => await updateProperty(input)),

	order: protectedProcedure
		.input(propertyOrderSchema)
		.mutation(async ({ input }) => await orderProperty(input)),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId } }) => await deleteProperty(id, userId)),

	addOption: protectedProcedure
		.input(propertyOptionCreateSchema)
		.mutation(async ({ input }) => await createPropertyOption(input)),

	updateOption: protectedProcedure
		.input(propertyOptionUpdateSchema)
		.mutation(async ({ input }) => await updatePropertyOption(input)),

	orderOption: protectedProcedure
		.input(propertyOptionOrderSchema)
		.mutation(async ({ input }) => await orderPropertyOption(input)),

	removeOption: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId } }) => await deletePropertyOption(id, userId))
});

async function listProperties(collectionId: string) {
	const properties = await prisma.property.findMany({
		where: { collectionId },
		orderBy: { order: 'asc' },
		include: { optionsM: { orderBy: { order: 'asc' } } }
	});

	const relationTargets = new Set<string>();
	const bundleTargets = new Set<string>();

	for (const property of properties) {
		if (isRelation(property)) relationTargets.add(property.targetCollection!);
		else if (isBundle(property)) bundleTargets.add(property.targetCollection!);
	}

	if (relationTargets.size === 0 && bundleTargets.size === 0) return properties;

	const [itemsMap, propertiesMap] = await Promise.all([
		relationTargets.size > 0
			? prisma.item
					.findMany({ where: { collectionId: { in: Array.from(relationTargets) } } })
					.then((items) => groupBy(items, 'collectionId'))
			: Promise.resolve(new Map()),

		bundleTargets.size > 0
			? prisma.property
					.findMany({ where: { collectionId: { in: Array.from(bundleTargets) } } })
					.then((props) => groupBy(props, 'collectionId'))
			: Promise.resolve(new Map())
	]);

	return properties.map((property) => injectPropertyOptions(property, itemsMap, propertiesMap));
}

function injectPropertyOptions(
	property: PropertyWithOptions,
	itemsMap: Map<string, Item[]>,
	propsMap: Map<string, Property[]>
) {
	if (isRelation(property)) {
		const items = itemsMap.get(property.targetCollection!) || [];

		return {
			...property,
			optionsM: items.map((item) => createXPropertyOption(item.id, item.name))
		};
	} else if (isBundle(property)) {
		const properties = propsMap.get(property.targetCollection!) || [];
		const extTargetProperty = properties.find((p) => p.id === property.extTargetProperty);
		let format = property.format;
		let decimals = property.decimals;

		if (
			extTargetProperty &&
			property.calculate &&
			NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS.includes(property.calculate)
		) {
			format = extTargetProperty.format;
			decimals = extTargetProperty.decimals;
		}

		return {
			...property,
			format: format,
			decimals: decimals,
			optionsM: properties.map((p) => createXPropertyOption(p.id, p.name, p.type.toString()))
		};
	}

	return property;
}

async function updateProperty(args: z.infer<typeof propertyUpdateSchema>) {
	const { id, ...rest } = args;

	return await prisma.$transaction(async (tx) => {
		const storedProperty = await tx.property.findFirstOrThrow({
			where: { id },
			include: {
				collection: { select: { name: true, views: true } }
			}
		});

		let relatedProperty = undefined;
		if (shouldCreateBidirectionalRef(storedProperty, args)) {
			relatedProperty = await createBidirectionalRelation(
				storedProperty,
				args,
				storedProperty.collection.name
			);
		}

		if (rest.type && !GROUPABLE_PROPERTY_TYPES.includes(rest.type)) {
			const viewsGroupedBy = getViewsGroupedBy(storedProperty.collection.views, id);

			if (viewsGroupedBy.length > 0) {
				await tx.view.updateMany({
					where: { id: { in: viewsGroupedBy.map((v) => v.id) } },
					data: { groupBy: null }
				});
			}
		}

		const property = await tx.property.update({
			where: { id },
			data: { ...rest, relatedProperty },
			include: { optionsM: true }
		});

		return injectPropertyOptionsAsync(property);
	});
}

async function createBidirectionalRelation(
	storedProperty: Property,
	args: z.infer<typeof propertyUpdateSchema>,
	collectionName: string
) {
	const exists = !!(await prisma.property.findFirst({
		where: {
			type: PropertyType.RELATION,
			collectionId: args.targetCollection!,
			targetCollection: storedProperty.collectionId,
			relatedProperty: storedProperty.id
		}
	}));

	if (exists) return;

	const property = await createProperty({
		name: `Related to ${collectionName}`,
		type: PropertyType.RELATION,
		collectionId: args.targetCollection!,
		targetCollection: storedProperty.collectionId,
		relatedProperty: storedProperty.id
	});

	return property.id;
}

async function injectPropertyOptionsAsync(property: PropertyWithOptions) {
	if (isRelation(property)) {
		const items = await prisma.item.findMany({
			where: { collectionId: property.targetCollection! }
		});

		return {
			...property,
			optionsM: items.map((item) => createXPropertyOption(item.id, item.name))
		};
	} else if (isBundle(property)) {
		const properties = await prisma.property.findMany({
			where: { collectionId: property.targetCollection! }
		});

		const extTargetProperty = properties.find((p) => p.id === property.extTargetProperty);
		let format = property.format;
		let decimals = property.decimals;

		if (
			extTargetProperty &&
			property.calculate &&
			NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS.includes(property.calculate)
		) {
			format = extTargetProperty.format;
			decimals = extTargetProperty.decimals;
		}

		return {
			...property,
			format,
			decimals,
			optionsM: properties.map((p) => createXPropertyOption(p.id, p.name, p.type.toString()))
		};
	}

	return property;
}

async function createProperty(args: z.infer<typeof propertyCreateSchema>) {
	const order = await prisma.property.count({ where: { collectionId: args.collectionId } });
	const property = await prisma.property.create({
		data: { ...args, order: order + 1 },
		include: { optionsM: true }
	});

	const promises: Promise<unknown>[] = [];

	if (hasRef(property.type)) {
		promises.push(
			prisma.item.updateMany({
				where: { collectionId: property.collectionId },
				data: { properties: { push: { id: property.id, value: '' } } }
			})
		);
	}

	promises.push(
		prisma.view.updateMany({
			where: { collectionId: property.collectionId },
			data: { properties: { push: { id: property.id, isVisible: true } } }
		})
	);

	await Promise.all(promises);

	return property;
}

async function orderProperty(args: z.infer<typeof propertyOrderSchema>) {
	const property = await prisma.property.findFirstOrThrow({
		where: { collectionId: args.collectionId, order: args.start }
	});

	const promises: Promise<unknown>[] = [];

	if (args.start < args.end) {
		promises.push(
			prisma.property.updateMany({
				where: { collectionId: args.collectionId, order: { gt: args.start, lte: args.end } },
				data: { order: { decrement: 1 } }
			})
		);
	} else {
		promises.push(
			prisma.property.updateMany({
				where: { collectionId: args.collectionId, order: { gte: args.end, lt: args.start } },
				data: { order: { increment: 1 } }
			})
		);
	}

	promises.push(
		prisma.property.update({
			where: { id: property.id },
			data: { order: args.end }
		})
	);

	await Promise.all(promises);
}

async function deleteProperty(id: string, userId: string) {
	const property = await prisma.property.findUniqueOrThrow({
		where: { id },
		include: {
			collection: {
				select: {
					id: true,
					ownerId: true,
					views: true
				}
			}
		}
	});

	if (property.collection.ownerId !== userId) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	if (property.type === PropertyType.FILE) {
		const objectsList = await listObjects(
			`collections/collection-${property.collectionId}`,
			`/property-${id}/`
		);
		await removeObjects(objectsList);
	}

	await prisma.$transaction(async (tx) => {
		const promises: Promise<unknown>[] = [];

		if (hasRef(property.type)) {
			promises.push(
				tx.item.updateMany({
					where: { collectionId: property.collection.id },
					data: { properties: { deleteMany: { where: { id } } } }
				})
			);
		}

		const viewsGroupedBy = getViewsGroupedBy(property.collection.views, id);
		const viewsFilteredBy = getViewsFilteredBy(property.collection.views, id);
		const viewsSortedBy = getViewSortedBy(property.collection.views, id);

		if (viewsGroupedBy.length > 0) {
			promises.push(
				tx.view.updateMany({
					where: { id: { in: viewsGroupedBy.map((v) => v.id) } },
					data: { groupBy: null }
				})
			);
		}

		if (viewsFilteredBy.length > 0) {
			for (const view of viewsFilteredBy) {
				promises.push(
					tx.view.update({
						where: { id: view.id },
						data: { filters: view.filters.filter((f) => f.id !== id) }
					})
				);
			}
		}

		if (viewsSortedBy.length > 0) {
			for (const view of viewsSortedBy) {
				promises.push(
					tx.view.update({
						where: { id: view.id },
						data: { sorts: view.sorts.filter((s) => s.field !== id) }
					})
				);
			}
		}

		if (isBidirectionalRelation(property)) {
			promises.push(
				tx.property.updateMany({
					where: { id: property.relatedProperty!, type: PropertyType.RELATION },
					data: { relatedProperty: '' }
				})
			);
		}

		promises.push(
			tx.view.updateMany({
				where: { collectionId: property.collection.id },
				data: { properties: { deleteMany: { where: { id } } } }
			})
		);

		promises.push(tx.property.delete({ where: { id } }));

		promises.push(
			tx.property.updateMany({
				where: {
					collectionId: property.collectionId,
					order: { gt: property.order }
				},
				data: { order: { decrement: 1 } }
			})
		);

		await Promise.all(promises);
	});
}

async function createPropertyOption(option: z.infer<typeof propertyOptionCreateSchema>) {
	const order = await prisma.propertyOption.count({ where: { propertyId: option.propertyId } });
	return await prisma.propertyOption.create({ data: { ...option, order: order + 1 } });
}

async function updatePropertyOption(option: z.infer<typeof propertyOptionUpdateSchema>) {
	const { id, ...rest } = option;

	return await prisma.propertyOption.update({
		where: { id },
		data: { ...rest }
	});
}

async function orderPropertyOption(args: z.infer<typeof propertyOptionOrderSchema>) {
	const option = await prisma.propertyOption.findFirstOrThrow({
		where: { propertyId: args.propertyId, order: args.start }
	});

	await prisma.$transaction(async (tx) => {
		const promises: Promise<unknown>[] = [];

		if (args.start < args.end) {
			promises.push(
				tx.propertyOption.updateMany({
					where: { propertyId: args.propertyId, order: { gt: args.start, lte: args.end } },
					data: { order: { decrement: 1 } }
				})
			);
		} else {
			promises.push(
				tx.propertyOption.updateMany({
					where: { propertyId: args.propertyId, order: { gte: args.end, lt: args.start } },
					data: { order: { increment: 1 } }
				})
			);
		}

		promises.push(
			tx.propertyOption.update({
				where: { id: option.id },
				data: { order: args.end }
			})
		);

		await Promise.all(promises);
	});
}

async function deletePropertyOption(id: string, userId: string) {
	const option = await prisma.propertyOption.findUniqueOrThrow({
		where: { id },
		include: {
			property: {
				include: { collection: { select: { ownerId: true } } }
			}
		}
	});

	if (option.property.collection.ownerId !== userId) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	await prisma.$transaction(async (tx) => {
		await Promise.all([
			tx.propertyOption.delete({ where: { id } }),
			tx.propertyOption.updateMany({
				where: {
					propertyId: option.propertyId,
					order: { gt: option.order }
				},
				data: { order: { decrement: 1 } }
			})
		]);
	});
}

function getViewsGroupedBy(views: View[], pid: string) {
	return views.filter((view) => view.groupBy === pid);
}

function getViewsFilteredBy(views: View[], pid: string) {
	return views.filter((view) => view.filters.some((filter) => filter.id === pid));
}

function getViewSortedBy(views: View[], pid: string) {
	return views.filter((view) => view.sorts.some((sort) => sort.field === pid));
}

function shouldCreateBidirectionalRef(
	property: Property,
	updData: z.infer<typeof propertyUpdateSchema>
) {
	return (
		property.type === PropertyType.RELATION &&
		updData.targetCollection != null &&
		updData.targetCollection != property.targetCollection
	);
}

function createXPropertyOption(id: string, value: string, extra?: string) {
	const date = new Date();
	return {
		id,
		value,
		extra,
		propertyId: id,
		color: Color.GRAY,
		order: 0,
		createdAt: date,
		updatedAt: date
	} as XPropertyOption;
}
