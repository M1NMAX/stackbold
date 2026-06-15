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
import type { ServiceHealth } from '$lib/types';
import { TRPCError } from '@trpc/server';

export const admin = createTRPCRouter({
	ping: adminProcedure.query(() => ({ pong: true, ts: new Date().toISOString() })),
	systemSummary: adminProcedure.query(systemSummary),
	usersSummary: adminProcedure.query(usersSummary),
	collectionsSummary: adminProcedure.query(collectionsSummary),
	listUsers: adminProcedure.query(listUsers)
});

async function systemSummary() {
	const start = performance.now();
	const [db, st] = await Promise.allSettled([checkDb(), checkStorage()]);

	const services = [
		{ name: 'App', status: HEALTH_STATUS.HEALTHY, latency: Math.round(performance.now() - start) },
		{ name: 'Databse', ...settleServiceStatus(db, DATABASE_DEGRADED_MS) },
		{ name: 'Storage', ...settleServiceStatus(st, STORAGE_DEGRADED_MS) }
	];

	return {
		checkedAt: new Date().toISOString(),
		overall: overallStatus(services),
		services
	};
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

async function listUsers() {
	return await prisma.user.findMany({
		select: {
			name: true,
			email: true,
			emailVerified: true,
			createdAt: true,
			role: true,
			_count: { select: { collections: true } },
			sessions: { select: { updatedAt: true }, distinct: ['userId'] }
		},

		orderBy: { name: 'asc' }
	});
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
	thresholdMs: number
) {
	if (result.status === 'rejected') return { status: HEALTH_STATUS.UNHEALTHY, latency: 0 };

	const latency = result.value.latency;
	if (latency > thresholdMs) return { status: HEALTH_STATUS.DEGRADED, latency };

	return { status: HEALTH_STATUS.HEALTHY, latency };
}

function overallStatus(services: ServiceHealth[]) {
	if (services.some((s) => s.status === HEALTH_STATUS.UNHEALTHY)) return HEALTH_STATUS.UNHEALTHY;
	if (services.some((s) => s.status === HEALTH_STATUS.DEGRADED)) return HEALTH_STATUS.DEGRADED;
	return HEALTH_STATUS.HEALTHY;
}
