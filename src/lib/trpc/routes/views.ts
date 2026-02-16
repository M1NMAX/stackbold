import { GROUPABLE_PROPERTY_TYPES } from '$lib/constant/index.js';
import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { SortType, ViewType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const filterSchema = z.object({
	id: z.string(),
	values: z.array(z.string())
});

const sortSchema = z.object({
	field: z.string(),
	order: z.enum(SortType)
});

const viewPropertySchema = z.object({
	id: z.string(),
	isVisible: z.boolean()
});

const viewCreateSchema = z.object({
	collectionId: z.string(),
	name: z.string(),
	type: z.enum(ViewType),
	properties: z.array(viewPropertySchema).optional(),
	filters: z.array(filterSchema).optional(),
	sorts: z.array(sortSchema).optional(),
	groupBy: z.string().nullish(),
	hideEmptyGroups: z.boolean().nullish(),
	hideItemCounts: z.boolean().nullish()
});

const viewUpdateSchema = viewCreateSchema.extend({ id: z.string() }).partial({
	collectionId: true,
	name: true,
	type: true
});

const viewOrderSchema = z.object({
	collectionId: z.string(),
	start: z.number(),
	end: z.number()
});

export const views = createTRPCRouter({
	list: protectedProcedure.input(z.string()).query(async ({ input }) => await listViews(input)),

	load: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.view.findUniqueOrThrow({ where: { id: input } })),

	create: protectedProcedure
		.input(viewCreateSchema)
		.mutation(async ({ input }) => await createView(input)),

	update: protectedProcedure
		.input(viewUpdateSchema)
		.mutation(async ({ input }) => await updView(input)),

	order: protectedProcedure
		.input(viewOrderSchema)
		.mutation(async ({ input }) => await orderView(input)),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ input: id, ctx: { userId } }) => deleteView(id, userId))
});

async function listViews(collectionId: string) {
	return await prisma.view.findMany({
		where: { collectionId },
		orderBy: [{ order: 'asc' }, { shortId: 'asc' }]
	});
}

async function createView(view: z.infer<typeof viewCreateSchema>) {
	const [aggregate, properties] = await Promise.all([
		prisma.view.aggregate({
			where: { collectionId: view.collectionId },
			_count: true,
			_max: { shortId: true }
		}),
		prisma.property.findMany({ where: { collectionId: view.collectionId } })
	]);

	let groupBy = view.groupBy;

	if (view.type === ViewType.BOARD) {
		const groupableProperties = properties.filter((p) => GROUPABLE_PROPERTY_TYPES.includes(p.type));
		if (groupableProperties.length !== 0) {
			groupBy = groupableProperties[0].id;
		}
	}

	return await prisma.view.create({
		data: {
			...view,
			groupBy,
			shortId: (aggregate._max.shortId || 0) + 1,
			order: aggregate._count + 1,
			filters: [],
			properties: properties.map((prop) => ({
				id: prop.id,
				isVisible: true
			}))
		}
	});
}

async function updView(view: z.infer<typeof viewUpdateSchema>) {
	const { id, ...rest } = view;

	const storedView = await prisma.view.findUnique({
		where: { id },
		select: { groupBy: true, collectionId: true }
	});
	if (!storedView) throw new TRPCError({ code: 'BAD_REQUEST', message: 'View not found' });

	let groupBy = view.groupBy;
	if (!storedView.groupBy && view.type && view.type === ViewType.BOARD) {
		const property = await prisma.property.findFirst({
			where: {
				collectionId: storedView.collectionId,
				type: { in: GROUPABLE_PROPERTY_TYPES }
			}
		});

		if (property) groupBy = property.id;
	}

	return await prisma.view.update({
		where: { id },
		data: { ...rest, groupBy }
	});
}

async function orderView(args: z.infer<typeof viewOrderSchema>) {
	const view = await prisma.view.findFirstOrThrow({
		where: { collectionId: args.collectionId, order: args.start }
	});

	const promises: Promise<unknown>[] = [];

	if (args.start < args.end) {
		promises.push(
			prisma.view.updateMany({
				where: { collectionId: args.collectionId, order: { gt: args.start, lte: args.end } },
				data: { order: { decrement: 1 } }
			})
		);
	} else {
		promises.push(
			prisma.view.updateMany({
				where: { collectionId: args.collectionId, order: { gte: args.end, lt: args.start } },
				data: { order: { increment: 1 } }
			})
		);
	}

	promises.push(
		prisma.view.update({
			where: { id: view.id },
			data: { order: args.end }
		})
	);

	await Promise.all(promises);
}

async function deleteView(id: string, userId: string) {
	const view = await prisma.view.findUniqueOrThrow({
		where: { id },
		include: {
			collection: true
		}
	});

	if (view.collection.ownerId !== userId) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	await prisma.$transaction(async (tx) => {
		await Promise.all([
			tx.view.delete({ where: { id } }),
			tx.view.updateMany({
				where: {
					collectionId: view.collectionId,
					order: { gt: view.order }
				},
				data: {
					order: { decrement: 1 }
				}
			})
		]);
	});
}
