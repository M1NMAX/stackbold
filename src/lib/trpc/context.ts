import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext(event: RequestEvent) {
	const session = await event.locals.getSession();

	return { session };
}

export type Context = inferAsyncReturnType<typeof createContext>;
