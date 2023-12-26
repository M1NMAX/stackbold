import type { Context } from '$lib/trpc/context';
import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';

export const t = initTRPC.context<Context>().create({ transformer: superjson });

export const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
	const start = Date.now();
	const result = await next();
	const ms = Date.now() - start;
	console.log(`${result.ok ? 'OK' : 'ERR'} ${type} ${path} - ${ms}ms`);

	return result;
});

export const authMiddleware = t.middleware(async ({ next, ctx }) => {
	if (!ctx.session?.user.email) throw new TRPCError({ code: 'UNAUTHORIZED' });

	return next({ ctx: { session: ctx.session, userId: ctx.session.user.userId } });
});

export const adminMiddleware = t.middleware(async ({ next, ctx }) => {
	if (ctx.session?.user.role !== 'ADMIN') throw new TRPCError({ code: 'UNAUTHORIZED' });
	return next();
});
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure.use(loggerMiddleware);

export const protectedProcedure = t.procedure.use(loggerMiddleware).use(authMiddleware);

export const adminProcedure = t.procedure
	.use(loggerMiddleware)
	.use(authMiddleware)
	.use(adminMiddleware);
