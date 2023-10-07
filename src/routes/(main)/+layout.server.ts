import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth.validate();

	if (!session) throw redirect(302, '/login');

	if (!session.user.emailVerified) {
		throw redirect(302, '/email-verification');
	}

	const user = session.user;

	const collections = router
		.createCaller(await createContext(event))
		.collections.getUserCollections();

	return { user, collections };
};
