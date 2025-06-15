import { prisma } from '$lib/server/prisma';
import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { isRelation } from '$lib/trpc/utils';
import { PropertyType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const propertyRefSchema = z.object({ id: z.string(), value: z.string() });

const itemCreateSchema = z.object({
	name: z.string(),
	collectionId: z.string(),
	properties: z.array(propertyRefSchema).optional()
});

const itemUpdateSchema = itemCreateSchema
	.merge(z.object({ id: z.string() }))
	.partial({ name: true, collectionId: true });

const propertyUpdateSchema = z.object({ id: z.string(), ref: propertyRefSchema });

export const items = createTRPCRouter({
	list: protectedProcedure
		.input(z.string())
		.query(({ input }) => prisma.item.findMany({ where: { collectionId: input } })),

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

	updateProperty: protectedProcedure
		.input(propertyUpdateSchema)
		.mutation(async ({ input: { id, ref } }) => {
			const { id: pid, ...rest } = ref;

			await updBidirectionalRelationRef({ id, ref });

			return await prisma.item.update({
				where: { id },
				data: {
					properties: {
						updateMany: { where: { id: pid }, data: rest }
					}
				}
			});
		})
});

async function updBidirectionalRelationRef(args: z.infer<typeof propertyUpdateSchema>) {
	const { id, ref } = args;

	const property = await prisma.property.findFirstOrThrow({ where: { id: ref.id } });
	if (!isRelation(property) || !property.relatedProperty) return;

	const storedRefValue = await getStoredRefValue(id, ref.id);

	const { ids, isDeletion } = getTargetIdsAndMode(storedRefValue, ref.value);
	if (ids.length === 0) return;

	const relatedProperty = await prisma.property.findFirstOrThrow({
		where: { id: property.relatedProperty, type: PropertyType.RELATION }
	});

	const items = await prisma.item.findMany({ where: { id: { in: ids } } });

	await Promise.all(
		items.map(async (item) => {
			const innerRef = item.properties.find((r) => r.id === relatedProperty.id);
			if (!innerRef) return;

			let values = innerRef.value ? innerRef.value.split('|') : [];

			if (isDeletion) values = values.filter((v) => v !== id);
			else if (!values.includes(id)) values.push(id);

			await prisma.item.update({
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
		})
	);
}

async function getStoredRefValue(itemId: string, refId: string) {
	const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });

	const ref = item.properties.find((ref) => ref.id === refId);
	if (!ref) throw new Error('Unable to find ref ' + refId);

	return ref.value;
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
