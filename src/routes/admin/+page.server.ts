import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { Role } from '@prisma/client';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;

	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');
	if (user.role !== Role.ADMIN) redirect(302, '/');

	const caller = createCaller(await createContext(event));

	const [systems, users, collections, templates] = await Promise.all([
		caller.admin.healthSummary(),
		caller.admin.usersSummary(),
		caller.admin.collectionsSummary(),
		caller.templates.list()
	]);

	return { systems, users, collections, templates };
};
