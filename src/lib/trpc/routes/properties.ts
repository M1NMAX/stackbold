import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
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
	options: z.array(optionSchema).optional()
});

const propertyUpdateSchema = propertyCreateSchema
	.merge(z.object({ id: z.string() }))
	.partial({ collectionId: true, name: true });

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
		.query(({ input }) =>
			prisma.property.findMany({ where: { collectionId: input }, orderBy: { order: 'asc' } })
		),

	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.property.findUnique({ where: { id: input } })),

	create: protectedProcedure.input(propertyCreateSchema).mutation(async ({ input: property }) => {
		const createdProp = await prisma.property.create({ data: property });

		if (createdProp.type !== 'CREATED') {
			await prisma.item.updateMany({
				where: { collectionId: createdProp.collectionId },
				data: { properties: { push: { id: createdProp.id, value: '' } } }
			});
		}

		return createdProp;
	}),

	update: protectedProcedure
		.input(propertyUpdateSchema)
		.mutation(async ({ input: { id, ...rest } }) =>
			prisma.property.update({ where: { id }, data: { ...rest } })
		),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input: id, ctx: { userId } }) => {
		const property = await prisma.property.findFirstOrThrow({
			where: { id },
			select: {
				type: true,
				collection: {
					select: { id: true, ownerId: true, filterConfigs: true, groupByConfigs: true }
				}
			}
		});

		if (property.collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

		if (property.type !== 'CREATED') {
			await prisma.item.updateMany({
				where: { collectionId: property.collection.id },
				data: { properties: { deleteMany: { where: { id } } } }
			});
		}

		const groupBy = wasGroupBy(property.collection.groupByConfigs, id);
		const filters = wasFilter(property.collection.filterConfigs, id);

		if (groupBy.tainted || filters.tainted) {
			await prisma.collection.update({
				where: { id: property.collection.id },
				data: {
					groupByConfigs: groupBy.tainted ? groupBy.groupByConfigs : [],
					filterConfigs: filters.tainted ? filters.filterConfigs : []
				}
			});
		}

		await prisma.property.delete({ where: { id } });
	}),

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
