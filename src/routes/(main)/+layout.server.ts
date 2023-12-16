import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth.validate();

	if (!session) redirect(302, '/login');

	if (!session.user.emailVerified) {
		redirect(302, '/email-verification');
	}

	const user = session.user;

	const collections = await router.createCaller(await createContext(event)).collections.list();

	const groups = await router.createCaller(await createContext(event)).groups.list();

	return { user, collections, groups };
};
