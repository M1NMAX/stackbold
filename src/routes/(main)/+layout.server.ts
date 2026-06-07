import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (event.locals.session === null || event.locals.user === null) redirect(302, '/signin');
	if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
	if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified)
		redirect(302, '/2fa');

	const caller = createCaller(await createContext(event));

	const [groups, collections] = await Promise.all([
		caller.groups.list(),
		caller.collections.list()
	]);

	return { collections, groups, user: { ...event.locals.user, inAdmin: false } };
};
