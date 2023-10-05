import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext(event: RequestEvent) {
	try {
		const session = await event.locals.auth.validate();
		if (!session) return { userId: '' };

		return { userId: session.user.userId };
	} catch {
		return { userId: '' };
	}
}

export type Context = inferAsyncReturnType<typeof createContext>;
