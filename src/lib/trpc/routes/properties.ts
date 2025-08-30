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

const colorSchema = z.nativeEnum(Color);
const propertyTypeSchema = z.nativeEnum(PropertyType);
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
	options: z.array(optionSchema).optional(),
	order: z.number().optional(),
	aggregator: aggregatorSchema.nullish(),
	defaultValue: z.string().nullish(),
	targetCollection: z.string().nullish(),
	relatedProperty: z.string().nullish(),
	intTargetProperty: z.string().nullish(),
	extTargetProperty: z.string().nullish(),
	calculate: aggregatorSchema.nullish()
});

const propertyUpdateSchema = propertyCreateSchema
	.merge(z.object({ id: z.string() }))
	.partial({ collectionId: true, name: true });

const propertyOrderSchema = z.object({
	collectionId: z.string(),
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

async function listProperties(collectionId: string) {
	const properties = await prisma.property.findMany({
		where: { collectionId },
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
				color: Color.GRAY,
				extra: ''
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
		relatedProperty: storedProperty.id
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
				color: Color.GRAY,
				extra: ''
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

	let promises: Promise<any>[] = [];

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

	let promises: Promise<any>[] = [];

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
