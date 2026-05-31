import {
	DATABASE_DEGRADED_MS,
	HEALTH_STATUS,
	SIXTY_DAY_AGO,
	STORAGE_DEGRADED_MS,
	THIRTY_DAY_AGO
} from '$lib/constant/index.js';
import { removeObject, statObject, uploadObject } from '$lib/server/minio';
import { prisma } from '$lib/server/prisma';
import { adminProcedure, createTRPCRouter } from '$lib/trpc/t';
import { TRPCError } from '@trpc/server';

export const admin = createTRPCRouter({
	healthSummary: adminProcedure.query(healthSummary),
	usersSummary: adminProcedure.query(usersSummary),
	collectionsSummary: adminProcedure.query(collectionsSummary),

	list: adminProcedure.query(async () => {
		return await prisma.user.findMany({
			select: { id: true, name: true, email: true, role: true, emailVerified: true },
			orderBy: { name: 'asc' }
		});
	})
});

async function healthSummary() {
	const [db, st] = await Promise.allSettled([checkDb(), checkStorage()]);
	return [
		{ name: 'App', status: HEALTH_STATUS.HEALTHY },
		{ name: 'Databse', status: settleServiceStatus(db, DATABASE_DEGRADED_MS) },
		{ name: 'Storage', status: settleServiceStatus(st, STORAGE_DEGRADED_MS) }
	];
}

async function usersSummary() {
	const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAY_AGO);
	const sixtyDaysAgo = new Date(Date.now() - SIXTY_DAY_AGO);

	const [total, newUsersThisPeriod, newUsersPrevPeriod, mau, mauPrevPeriod] =
		await prisma.$transaction([
			prisma.user.count(),
			prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
			prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),

			prisma.session.findMany({
				where: { updatedAt: { gte: thirtyDaysAgo } },
				select: { userId: true },
				distinct: ['userId']
			}),

			prisma.session.findMany({
				where: { updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
				select: { userId: true },
				distinct: ['userId']
			})
		]);

	return {
		total: {
			counter: total.toString(),
			grow: calculateGrow(newUsersThisPeriod, newUsersPrevPeriod)
		},
		mau: {
			counter: mau.length.toString(),
			grow: calculateGrow(mau.length, mauPrevPeriod.length)
		}
	};
}

async function collectionsSummary() {
	const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAY_AGO);
	const sixtyDaysAgo = new Date(Date.now() - SIXTY_DAY_AGO);

	const [
		totalCollections,
		totalCollectionsThisPeriod,
		totalCollectionsPrevPeriod,
		totalItems,
		totalItemsThisPeriod,
		totalItemsPrevPeriod
	] = await Promise.all([
		prisma.collection.count(),
		prisma.collection.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
		prisma.collection.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),

		prisma.item.count(),
		prisma.item.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
		prisma.item.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
	]);

	return {
		total: {
			counter: totalCollections.toString(),
			grow: calculateGrow(totalCollectionsThisPeriod, totalCollectionsPrevPeriod)
		},
		items: {
			counter: totalItems.toString(),
			grow: calculateGrow(totalItemsThisPeriod, totalItemsPrevPeriod)
		}
	};
}

async function checkDb() {
	const start = Date.now();
	await prisma.$runCommandRaw({ ping: 1 });
	return { latency: Date.now() - start };
}

async function checkStorage() {
	const start = Date.now();
	const key = `__health__/${start}`;

	try {
		await uploadObject(key, 'ok');
		await statObject(key);
		await removeObject(key);
	} catch (err) {
		await removeObject(key).catch(() => {});
		throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
	}

	return { latency: Date.now() - start };
}

function calculateGrow(current: number, previous: number) {
	const diff = current - previous;
	const sign = diff > 0 ? '+' : '';

	if (previous <= 0) {
		return diff > 0 ? `+${diff} (new)` : '—';
	}

	const pct = Math.round((diff / previous) * 100);
	return `${diff} (${sign}${pct}%)`;
}

function settleServiceStatus(
	result: PromiseSettledResult<{ latency: number }>,
	degradedThresholdMs: number
) {
	if (result.status === 'rejected') return HEALTH_STATUS.UNHEALTHY;
	if (result.value.latency > degradedThresholdMs) return HEALTH_STATUS.DEGRADED;
	return HEALTH_STATUS.HEALTHY;
}
