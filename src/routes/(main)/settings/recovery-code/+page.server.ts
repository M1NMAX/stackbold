import { getUserRecoverCode } from '$lib/server/user';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session === null || event.locals.user === null) redirect(302, '/signin');
	if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
	if (!event.locals.user.registered2FA) redirect(302, '/settings/2fa-setup');
	if (!event.locals.session.twoFactorVerified) redirect(302, '/2fa');

	const recoveryCode = await getUserRecoverCode(event.locals.user.id);
	return { recoveryCode };
};
