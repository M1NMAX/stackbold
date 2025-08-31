import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/email-verification');

	const caller = createCaller(await createContext(event));

	const [groups, collections, tItems] = await Promise.all([
		caller.groups.list(),
		caller.collections.list(),
		caller.items.search()
	]);

	const items = tItems.map((item) => ({ ...item, type: 'item' }));

	return { user, collections, groups, items };
};
