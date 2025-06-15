import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { hasRef, isRelation } from '$lib/trpc/utils';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
	Aggregator,
	Color,
	PropertyType,
	View,
	type Filter,
	type FilterConfig,
	type GroupByConfig
} from '@prisma/client';

const colorSchema = z.nativeEnum(Color);
const propertyTypeSchema = z.nativeEnum(PropertyType);
const viewSchema = z.nativeEnum(View);
const aggregatorSchema = z.nativeEnum(Aggregator);

const optionSchema = z.object({
	id: z.string(),
	value: z.string(),
	color: colorSchema
});

const propertyCreateSchema = z.object({
	collectionId: z.string(),
	name: z.string(),
	type: propertyTypeSchema.optional(),
	aggregator: aggregatorSchema.optional(),
	defaultValue: z.string().optional(),
	visibleInViews: z.array(viewSchema).optional(),
	order: z.number().optional(),
	options: z.array(optionSchema).optional(),
	targetCollection: z.string().optional(),
	relatedProperty: z.string().optional()
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
		.mutation(async ({ input: { id, ...rest } }) => {
			const relatedProperty = await createBidirectionalRelation({ id, ...rest });

			return await prisma.property.update({
				where: { id },
				data: { ...rest, relatedProperty }
			});
		}),

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

	return await Promise.all(
		properties.map(async (property) => {
			if (!isRelation(property)) return property;

			const items = await prisma.item.findMany({
				where: { collectionId: property.targetCollection }
			});

			return {
				...property,
				options: items.map((item) => ({
					id: item.id,
					value: item.name,
					color: Color.GRAY
				}))
			};
		})
	);
}

async function createProperty(property: z.infer<typeof propertyCreateSchema>) {
	const order = await prisma.property.count({ where: { collectionId: property.collectionId } });

	const prop = await prisma.property.create({ data: { ...property, order: order + 1 } });

	if (hasRef(prop.type)) {
		await prisma.item.updateMany({
			where: { collectionId: prop.collectionId },
			data: { properties: { push: { id: prop.id, value: '' } } }
		});
	}

	return prop;
}

async function createBidirectionalRelation(args: z.infer<typeof propertyUpdateSchema>) {
	const storedProperty = await prisma.property.findFirstOrThrow({
		where: { id: args.id },
		include: { collection: { select: { name: true } } }
	});

	if (!args.targetCollection || args.targetCollection === storedProperty.targetCollection)
		return '';

	const exists = !!(await prisma.property.findFirst({
		where: {
			type: PropertyType.RELATION,
			collectionId: args.targetCollection,
			targetCollection: storedProperty.collectionId,
			relatedProperty: storedProperty.id
		}
	}));

	if (exists) return '';

	const property = await createProperty({
		name: `Related to ${storedProperty.collection.name}`,
		type: PropertyType.RELATION,
		collectionId: args.targetCollection,
		targetCollection: storedProperty.collectionId,
		relatedProperty: storedProperty.id,
		visibleInViews: []
	});

	return property.id;
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
	const property = await prisma.property.findFirstOrThrow({
		where: { id },
		include: {
			collection: {
				select: { id: true, ownerId: true, filterConfigs: true, groupByConfigs: true }
			}
		}
	});

	if (property.collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

	let promises: Promise<any>[] = [];

	if (hasRef(property.type)) {
		promises.push(
			prisma.item.updateMany({
				where: { collectionId: property.collection.id },
				data: { properties: { deleteMany: { where: { id } } } }
			})
		);
	}

	const groupBy = wasGroupBy(property.collection.groupByConfigs, id);
	const filters = wasFilter(property.collection.filterConfigs, id);

	if (groupBy.tainted || filters.tainted) {
		promises.push(
			prisma.collection.update({
				where: { id: property.collection.id },
				data: {
					groupByConfigs: groupBy.tainted ? groupBy.groupByConfigs : [],
					filterConfigs: filters.tainted ? filters.filterConfigs : []
				}
			})
		);
	}

	if (isRelation(property) && property.relatedProperty) {
		promises.push(
			prisma.property.update({
				where: { id: property.relatedProperty, type: PropertyType.RELATION },
				data: { relatedProperty: '' }
			})
		);
	}

	promises.push(prisma.property.delete({ where: { id } }));

	await Promise.all(promises);
}

function wasGroupBy(configs: GroupByConfig[], pid: string) {
	let tainted = false;
	let groupByConfigs: GroupByConfig[] = [];

	for (const config of configs) {
		if (config.propertyId === pid) {
			tainted = true;
			groupByConfigs.push({ ...config, propertyId: '' });
		}
	}

	return { tainted, groupByConfigs };
}

function wasFilter(configs: FilterConfig[], pid: string) {
	let tainted = false;
	let filterConfigs: FilterConfig[] = [];

	for (const config of configs) {
		let filters: Filter[] = [];
		for (const filter of config.filters) {
			if (filter.id === pid) {
				tainted = true;
				continue;
			} else {
				filters.push(filter);
			}
		}

		filterConfigs.push({ ...config, filters });
	}

	return { tainted, filterConfigs };
}
