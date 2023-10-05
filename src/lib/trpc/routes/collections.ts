import { t } from '$lib/trpc/t';
import { logger } from '$lib/trpc/middleware/logger';
import { auth } from '$lib/trpc/middleware/auth';
import { prisma } from '$lib/server/prisma';

export const collections = t.router({
	getUserCollections: t.procedure
		.use(logger)
		.use(auth)
		.query(({ ctx: { userId } }) =>
			prisma.collection.findMany({
				where: { ownerId: userId },
				orderBy: { name: 'asc' }
			})
		)
});
