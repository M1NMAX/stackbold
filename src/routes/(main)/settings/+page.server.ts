import { getUserRecoverCode } from '$lib/server/user';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session === null || event.locals.user === null) redirect(302, '/signin');
	if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
	if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified)
		redirect(302, '/2fa');

	let recoveryCode: string | null = null;
	if (event.locals.user.registered2FA)
		recoveryCode = await getUserRecoverCode(event.locals.user.id);

	return {
		recoveryCode,
		user: event.locals.user
	};
};
