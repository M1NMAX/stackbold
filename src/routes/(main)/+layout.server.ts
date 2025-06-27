import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) redirect(302, '/signin');

	if (!user.emailVerified) redirect(302, '/email-verification');

	const groups = await createCaller(await createContext(event)).groups.list();
	const collections = await createCaller(await createContext(event)).collections.list();

	const tmpItems = await createCaller(await createContext(event)).items.search();
	const items = tmpItems.map((item) => ({ ...item, type: 'item' }));

	return { user, collections, groups, items };
};
