import { createTRPCRouter, protectedProcedure } from '$lib/trpc/t';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
	BASE_FIELDS,
	DEFAULT_COLLECTION_ICON,
	DEFAULT_EDITOR_CONTENT,
	NAME_FIELD
} from '$lib/constant/index.js';
import { ViewType } from '@prisma/client';
import {
	capitalizeFirstLetter,
	escapeRegex,
	extractFilenameFromUrl,
	omit
} from '$lib/utils/index.js';
import {
	deleteFile,
	getFilePresignedDownloadUrl,
	getFilePresignedUploadUrl,
	listObjects,
	removeObjects
} from '$lib/server/minio';
import type { PropertiesSnapshot, PropertyWithOptions } from '$lib/types.js';
import { contentSchema } from '$lib/schema';
import { randomUUID } from 'crypto';

type PMNode = {
	type?: string;
	attrs?: Record<string, any>;
	content?: PMNode[];
	marks?: PMNode[];
};

const URL_ATTR_BY_TYPE: Record<string, string> = {
	image: 'src',
	attachment: 'url'
};

const collectionCreateSchema = z.object({
	icon: z.string().optional(),
	name: z.string(),
	isPinned: z.boolean().optional(),
	description: z.string().optional(),
	itemsOnly: z.boolean().optional(),
	groupId: z.string().nullable().optional()
});

const collectionUpdateSchema = collectionCreateSchema
	.extend({ id: z.string() })
	.partial({ name: true });

const collectionSaveContentSchema = z.object({
	id: z.string(),
	content: contentSchema
});

const attachmentUploadUrlSchema = z.object({
	collectionId: z.string(),
	filename: z.string()
});

const attachmentConfirmSchema = z.object({
	collectionId: z.string(),
	filename: z.string(),
	mimeType: z.string(),
	size: z.number(),
	key: z.string()
});

const downloadAttachmentSchema = z.object({
	collectionId: z.string(),
	key: z.string()
});

const orphanAttachmentSchema = z.object({
	collectionId: z.string(),
	key: z.string()
});

export const collections = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx: { userId } }) => {
		return await prisma.collection.findMany({
			where: { ownerId: userId },
			include: { views: { select: { shortId: true } }, _count: { select: { items: true } } },
			orderBy: { name: 'asc' }
		});
	}),

	recent: protectedProcedure.query(async ({ ctx: { userId } }) => {
		return await prisma.collection.findMany({
			where: { ownerId: userId },
			include: { views: { select: { shortId: true } }, _count: { select: { items: true } } },
			orderBy: { accessedAt: 'desc' },
			take: 10
		});
	}),

	search: protectedProcedure
		.input(z.string())
		.query(async ({ input, ctx: { userId } }) => await searchCollections(userId, input)),

	load: protectedProcedure.input(z.string()).query(async ({ input }) => {
		return await prisma.collection.update({
			where: { id: input },
			data: { accessedAt: new Date() },
			include: { views: { orderBy: [{ order: 'asc' }, { shortId: 'asc' }] } }
		});
	}),

	create: protectedProcedure
		.input(collectionCreateSchema)
		.mutation(async ({ input, ctx: { userId } }) => await createCollection(input, userId)),

	duplicate: protectedProcedure
		.input(z.string())
		.mutation(async ({ input, ctx: { userId } }) => await duplicateCollection(input, userId)),

	update: protectedProcedure
		.input(collectionUpdateSchema)
		.mutation(
			async ({ input: { id, ...rest } }) =>
				await prisma.collection.update({ where: { id }, data: { ...rest } })
		),

	saveContent: protectedProcedure
		.input(collectionSaveContentSchema)
		.mutation(async ({ input }) => await saveContent(input)),

	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ input, ctx }) => deleteCollection(input, ctx.userId)),

	attachmentUploadUrl: protectedProcedure
		.input(attachmentUploadUrlSchema)
		.mutation(async ({ input, ctx }) => attachmentUploadUrl(ctx.userId, input)),

	confirmAttachment: protectedProcedure
		.input(attachmentConfirmSchema)
		.mutation(async ({ input, ctx }) => confirmAttachment(ctx.userId, input)),

	downloadAttachment: protectedProcedure
		.input(downloadAttachmentSchema)
		.mutation(async ({ input, ctx }) => getDownloadAttachmentUrl(ctx.userId, input)),

	orphanAttachment: protectedProcedure
		.input(orphanAttachmentSchema)
		.mutation(async ({ input, ctx }) => orphanAttachment(ctx.userId, input))
});

async function searchCollections(userId: string, searchTerm: string) {
	const escaped = escapeRegex(searchTerm);

	return await prisma.collection.findMany({
		where: {
			ownerId: userId,
			OR: [
				{ name: { contains: escaped, mode: 'insensitive' } },
				{ items: { some: { name: { contains: escaped, mode: 'insensitive' } } } }
			]
		},
		select: {
			id: true,
			name: true,
			icon: true,
			views: { select: { shortId: true } },
			items: {
				where: { name: { contains: escaped, mode: 'insensitive' } },
				select: { id: true, name: true }
			}
		}
	});
}

async function createCollection(args: z.infer<typeof collectionCreateSchema>, userId: string) {
	const defaultView = {
		shortId: 1,
		order: 1,
		name: capitalizeFirstLetter(ViewType.LIST),
		type: ViewType.LIST,
		properties: [],
		filters: [],
		sorts: []
	};

	return await prisma.collection.create({
		data: {
			...args,
			ownerId: userId,
			icon: DEFAULT_COLLECTION_ICON,
			content: DEFAULT_EDITOR_CONTENT,
			views: { create: [defaultView] }
		},
		include: { views: { select: { shortId: true } }, _count: { select: { items: true } } }
	});
}

export async function duplicateCollection(id: string, ownerId: string) {
	const target = await prisma.collection.findUnique({
		where: { id },
		include: {
			views: true,
			items: true,
			properties: {
				orderBy: { order: 'asc' },
				include: { options: { orderBy: { order: 'asc' } } }
			}
		}
	});

	if (!target) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Collection not found' });

	const rest = omit(target, [...BASE_FIELDS, 'views', 'properties', 'items']);

	const propertiesData: ReturnType<typeof mapPropertyData>[] = [];
	const snapshots = new Map<string, PropertiesSnapshot>();

	for (const property of target.properties) {
		propertiesData.push(mapPropertyData(property));

		snapshots.set(`${property.name}-${property.order}`, {
			id: property.id,
			optionsIds: new Map<string, string>(
				property.options.map((o) => [`${o.value}-${o.order}`, o.id])
			)
		});
	}

	return await prisma.$transaction(async (tx) => {
		const collection = await tx.collection.create({
			data: {
				...rest,
				ownerId,
				isTemplate: false,
				content: DEFAULT_EDITOR_CONTENT,
				name: target.isTemplate ? rest.name : `${rest.name} copy`,
				properties: { create: [...propertiesData] }
			},
			include: {
				properties: {
					orderBy: { order: 'asc' },
					include: { options: { orderBy: { order: 'asc' } } }
				}
			}
		});

		const propertyIdsMap = new Map<string, string>();
		const newSnapshots = new Map<string, PropertiesSnapshot>();
		for (const property of collection.properties) {
			const key = `${property.name}-${property.order}`;
			const snap = snapshots.get(key);
			if (!snap) continue;
			newSnapshots.set(snap.id, {
				id: property.id,
				optionsIds: new Map<string, string>(
					property.options.flatMap((o) => {
						const oldOption = snap.optionsIds.get(`${o.value}-${o.order}`);
						return oldOption ? [[oldOption, o.id]] : [];
					})
				)
			});
		}

		const viewsData = target.views.map((view) => {
			const rest = omit(view, [...BASE_FIELDS, 'collectionId']);

			let groupBy = undefined;
			if (rest.groupBy) {
				const id = propertyIdsMap.get(rest.groupBy);
				groupBy = id ?? undefined;
			}

			const sorts = rest.sorts.map((sort) => {
				if (sort.field === NAME_FIELD) return { ...sort };

				const snap = newSnapshots.get(sort.field);
				return snap ? { ...sort, field: snap.id } : null;
			});

			const filters = rest.filters.map((filter) => {
				const snap = newSnapshots.get(filter.id);
				return snap ? { ...filter, id: snap.id } : null;
			});

			const properties = rest.properties.map((property) => {
				const snap = newSnapshots.get(property.id);
				return snap ? { ...property, id: snap.id } : null;
			});

			return {
				...rest,
				groupBy,
				collectionId: collection.id,
				sorts: sorts.filter((s) => s != null),
				filters: filters.filter((f) => f != null),
				properties: properties.filter((p) => p != null)
			};
		});

		const itemData = target.items.map((item) => {
			const rest = omit(item, [...BASE_FIELDS]);

			const refs = rest.properties.flatMap((ref) => {
				const snap = newSnapshots.get(ref.id);
				if (!snap) return [];

				const value = (ref.value && snap.optionsIds.get(ref.value)) || ref.value;

				return [{ id: snap.id, value }];
			});

			return {
				...rest,
				collectionId: collection.id,
				properties: refs
			};
		});

		await Promise.all([
			viewsData.length !== 0 ? tx.view.createMany({ data: viewsData }) : Promise.resolve(),
			itemData.length !== 0 ? tx.item.createMany({ data: itemData }) : Promise.resolve()
		]);

		return await tx.collection.findUniqueOrThrow({
			where: { id: collection.id },
			include: { views: { select: { shortId: true } }, _count: { select: { items: true } } }
		});
	});
}

function mapPropertyData(property: PropertyWithOptions) {
	const base = omit(property, [...BASE_FIELDS, 'collectionId']);

	const optionData = property.options.map((option) => omit(option, [...BASE_FIELDS, 'propertyId']));

	return {
		...base,
		options: { create: [...optionData] }
	};
}

async function saveContent(args: z.infer<typeof collectionSaveContentSchema>) {
	const { id, content } = args;

	const referencedKeys = extractAttachmentKeys(content);

	await prisma.$transaction([
		prisma.collection.update({
			where: { id },
			data: { content }
		}),

		prisma.collectionAttachment.updateMany({
			where: { collectionId: id, key: { in: referencedKeys } },
			data: { orphanedAt: null }
		}),

		prisma.collectionAttachment.updateMany({
			where: { collectionId: id, key: { notIn: referencedKeys } },
			data: { orphanedAt: new Date() }
		})
	]);
}

function extractAttachmentKeys(doc: PMNode): string[] {
	const keys = new Set<string>();

	function walk(node: PMNode) {
		if (!node) return;

		const attrKey = node.type ? URL_ATTR_BY_TYPE[node.type] : undefined;
		if (attrKey && node.attrs?.[attrKey]) {
			keys.add(extractFilenameFromUrl(node.attrs[attrKey], false));
		}

		node.content?.forEach(walk);
	}

	walk(doc);
	return [...keys];
}

async function deleteCollection(id: string, userId: string) {
	await canAccessCollection(id, userId);

	const objectsList = await listObjects(`collections/collection-${id}/`);
	await removeObjects(objectsList);

	await prisma.collection.delete({ where: { id } });
}

async function attachmentUploadUrl(
	userId: string,
	args: z.infer<typeof attachmentUploadUrlSchema>
) {
	await canAccessCollection(args.collectionId, userId);

	const ext = args.filename.split('.').pop();
	const key = `${randomUUID()}${ext ? '.' + ext : ''}`;

	return await getFilePresignedUploadUrl(getAttachmentPath(args.collectionId, key));
}

async function confirmAttachment(userId: string, args: z.infer<typeof attachmentConfirmSchema>) {
	await canAccessCollection(args.collectionId, userId);

	const attachment = await prisma.collectionAttachment.create({
		data: { ...args }
	});

	return { ...attachment, url: getAttachmentUrl(args.collectionId, args.key) };
}

export async function getDownloadAttachmentUrl(
	userId: string,
	args: z.infer<typeof downloadAttachmentSchema>
) {
	await canAccessCollection(args.collectionId, userId);

	const attachment = await prisma.collectionAttachment.findUnique({
		where: { key: args.key, collectionId: args.collectionId }
	});

	if (!attachment) throw new TRPCError({ code: 'BAD_REQUEST' });

	const path = getAttachmentPath(attachment.collectionId, attachment.key);
	const url = await getFilePresignedDownloadUrl(path, attachment.filename);

	return { filename: attachment.filename, url };
}

async function orphanAttachment(userId: string, args: z.infer<typeof orphanAttachmentSchema>) {
	await canAccessCollection(args.collectionId, userId);

	await prisma.collectionAttachment.update({
		where: { key: args.key },
		data: { orphanedAt: new Date() }
	});
}

async function canAccessCollection(collectionId: string, userId: string) {
	const collection = await prisma.collection.findUnique({ where: { id: collectionId } });

	if (!collection) throw new TRPCError({ code: 'BAD_REQUEST' });
	if (collection.ownerId !== userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

	return collection;
}

export async function cleanupOrphanedAttachments() {
	const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
	const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);

	const orphans = await prisma.collectionAttachment.findMany({
		where: { orphanedAt: { lte: cutoff } }
	});

	for (const orphan of orphans) {
		try {
			await deleteFile(getAttachmentPath(orphan.collectionId, orphan.key));
		} catch (err) {
			console.error(`Failed to remove ${orphan.key} from MinIO`, err);
			continue;
		}

		await prisma.collectionAttachment.delete({ where: { id: orphan.id } });
	}

	return { deleted: orphans.length };
}

function getAttachmentPath(cid: string, filename: string) {
	return `collections/collection-${cid}/${filename}`;
}

function getAttachmentUrl(cid: string, key: string) {
	return `/collections/${cid}/attachment/${key}`;
}
