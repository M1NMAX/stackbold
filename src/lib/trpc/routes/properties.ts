import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { groupBy, hasRef, isBidirectionalRelation, isBundle, isRelation } from '$lib/trpc/utils';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
	Aggregator,
	Color,
	PropertyType,
	View,
	type FilterConfig,
	type GroupByConfig,
	type Item,
	type Property
} from '@prisma/client';

const colorSchema = z.nativeEnum(Color);
const propertyTypeSchema = z.nativeEnum(PropertyType);
const viewSchema = z.nativeEnum(View);
const aggregatorSchema = z.nativeEnum(Aggregator);

const optionSchema = z.object({
	id: z.string(),
	value: z.string(),
	color: colorSchema,
	extra: z.string().nullish()
});

const propertyCreateSchema = z.object({
	collectionId: z.string(),
	name: z.string(),
	type: propertyTypeSchema.optional(),
	aggregator: aggregatorSchema.optional(),
	visibleInViews: z.array(viewSchema).optional(),
	order: z.number().optional(),
	options: z.array(optionSchema).optional(),
	defaultValue: z.string().nullish(),
	targetCollection: z.string().nullish(),
	relatedProperty: z.string().nullish(),
	intTargetProperty: z.string().nullish(),
	extTargetProperty: z.string().nullish(),
	calculate: aggregatorSchema.optional()
});

const propertyUpdateSchema = propertyCreateSchema
	.merge(z.object({ id: z.string() }))
	.partial({ collectionId: true, name: true });

const propertyOrderSchema = z.object({
	cid: z.string(),
	start: z.number(),
	end: z.number()
});

const optionAddSchema = z.object({
	pid: z.string(),
	option: optionSchema.required({ id: true })
});

const optionUpdateSchema = z.object({
	pid: z.string(),
	option: optionSchema.required({ id: true }).partial({ value: true, color: true })
});

const optionRemoveSchema = z.object({
	pid: z.string(),
	optionId: z.string()
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
		.mutation(async ({ input: property }) => await createProperty(property)),

	update: protectedProcedure
		.input(propertyUpdateSchema)
		.mutation(async ({ input }) => await updateProperty(input)),

	order: protectedProcedure
		.input(propertyOrderSchema)
		.mutation(async ({ input }) => await orderProperty(input)),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId } }) => await deleteProperty(id, userId)),

	addOption: protectedProcedure.input(optionAddSchema).mutation(async ({ input }) =>
		prisma.property.update({
			where: { id: input.pid },
			data: { options: { push: [input.option] } }
		})
	),

	updateOption: protectedProcedure.input(optionUpdateSchema).mutation(async ({ input }) =>
		prisma.property.update({
			where: { id: input.pid },
			data: { options: { updateMany: { where: { id: input.option.id }, data: input.option } } }
		})
	),

	removeOption: protectedProcedure.input(optionRemoveSchema).mutation(async ({ input }) =>
		prisma.property.update({
			where: { id: input.pid },
			data: { options: { deleteMany: { where: { id: input.optionId } } } }
		})
	)
});

async function listProperties(cid: string) {
	const properties = await prisma.property.findMany({
		where: { collectionId: cid },
		orderBy: { order: 'asc' }
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
	property: Property,
	itemsMap: Map<string, Item[]>,
	propsMap: Map<string, Property[]>
) {
	if (isRelation(property)) {
		const items = itemsMap.get(property.targetCollection!) || [];

		return {
			...property,
			options: items.map((item) => ({
				id: item.id,
				value: item.name,
				color: Color.GRAY
			}))
		};
	} else if (isBundle(property)) {
		const properties = propsMap.get(property.targetCollection!) || [];

		return {
			...property,
			options: properties.map((prop) => ({
				id: prop.id,
				value: prop.name,
				color: Color.GRAY,
				extra: prop.type.toString()
			}))
		};
	}

	return property;
}

async function updateProperty(args: z.infer<typeof propertyUpdateSchema>) {
	const { id, ...rest } = args;
	const relatedProperty = await createBidirectionalRelation({ id, ...rest });

	const property = await prisma.property.update({
		where: { id },
		data: { ...rest, relatedProperty }
	});

	return injectPropertyOptionsAsync(property);
}

async function createBidirectionalRelation(args: z.infer<typeof propertyUpdateSchema>) {
	const storedProperty = await prisma.property.findFirstOrThrow({
		where: { id: args.id },
		include: { collection: { select: { name: true } } }
	});

	if (!shouldCreateBidirectionalRef(storedProperty, args)) return;

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
		name: `Related to ${storedProperty.collection.name}`,
		type: PropertyType.RELATION,
		collectionId: args.targetCollection!,
		targetCollection: storedProperty.collectionId,
		relatedProperty: storedProperty.id,
		visibleInViews: []
	});

	return property.id;
}

async function injectPropertyOptionsAsync(property: Property) {
	if (isRelation(property)) {
		const items = await prisma.item.findMany({
			where: { collectionId: property.targetCollection! }
		});

		return {
			...property,
			options: items.map((item) => ({
				id: item.id,
				value: item.name,
				color: Color.GRAY
			}))
		};
	} else if (isBundle(property)) {
		const properties = await prisma.property.findMany({
			where: { collectionId: property.targetCollection! }
		});

		return {
			...property,
			options: properties.map((prop) => ({
				id: prop.id,
				value: prop.name,
				color: Color.GRAY,
				extra: prop.type.toString()
			}))
		};
	}

	return property;
}

async function createProperty(args: z.infer<typeof propertyCreateSchema>) {
	const order = await prisma.property.count({ where: { collectionId: args.collectionId } });
	const property = await prisma.property.create({ data: { ...args, order: order + 1 } });

	if (hasRef(property.type)) {
		await prisma.item.updateMany({
			where: { collectionId: property.collectionId },
			data: { properties: { push: { id: property.id, value: '' } } }
		});
	}

	return property;
}

async function orderProperty(args: z.infer<typeof propertyOrderSchema>) {
	const property = await prisma.property.findFirstOrThrow({
		where: { collectionId: args.cid, order: args.start }
	});

	let promises: Promise<any>[] = [];

	if (args.start < args.end) {
		promises.push(
			prisma.property.updateMany({
				where: { collectionId: args.cid, order: { gt: args.start, lte: args.end } },
				data: { order: { decrement: 1 } }
			})
		);
	} else {
		promises.push(
			prisma.property.updateMany({
				where: { collectionId: args.cid, order: { gte: args.end, lt: args.start } },
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
					filterConfigs: true,
					groupByConfigs: true,
					_count: { select: { properties: true } }
				}
			}
		}
	});

	if (property.collection.ownerId !== userId) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	await prisma.$transaction(async (tx) => {
		let promises: Promise<any>[] = [];

		if (hasRef(property.type)) {
			promises.push(
				tx.item.updateMany({
					where: { collectionId: property.collection.id },
					data: { properties: { deleteMany: { where: { id } } } }
				})
			);
		}

		const isUsedToGroupBy = isUsedToGroup(property.collection.groupByConfigs, id);
		const isUsedAsFilter = isFilter(property.collection.filterConfigs, id);

		if (isUsedToGroupBy || isUsedAsFilter) {
			promises.push(
				tx.collection.update({
					where: { id: property.collection.id },
					data: {
						groupByConfigs: isUsedToGroupBy
							? cleanGroupBy(property.collection.groupByConfigs, id)
							: undefined,
						filterConfigs: isUsedAsFilter
							? cleanFilters(property.collection.filterConfigs, id)
							: undefined
					}
				})
			);
		}

		if (isBidirectionalRelation(property)) {
			promises.push(
				tx.property.updateMany({
					where: { id: property.relatedProperty!, type: PropertyType.RELATION },
					data: { relatedProperty: '' }
				})
			);
		}

		promises.push(tx.property.delete({ where: { id } }));

		promises.push(
			tx.property.updateMany({
				where: {
					collectionId: property.collectionId,
					order: { gt: property.order, lte: property.collection._count.properties }
				},
				data: { order: { decrement: 1 } }
			})
		);

		await Promise.all(promises);
	});
}

function isUsedToGroup(configs: GroupByConfig[], pid: string) {
	return configs.some((config) => config.propertyId === pid);
}

function cleanGroupBy(configs: GroupByConfig[], pid: string) {
	return configs.map((config) => ({
		...config,
		propertyId: config.propertyId === pid ? '' : config.propertyId
	}));
}

function isFilter(configs: FilterConfig[], pid: string) {
	return configs.some((config) => config.filters.some((filter) => filter.id === pid));
}

function cleanFilters(configs: FilterConfig[], pid: string) {
	return configs.map((config) => ({
		...config,
		filters: config.filters.filter((filter) => filter.id !== pid)
	}));
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
