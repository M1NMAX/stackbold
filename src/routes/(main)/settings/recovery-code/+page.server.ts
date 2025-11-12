import { getUserRecoverCode, updateUserRecoveryCode } from '$lib/server/user';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;
	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');

	const recoveryCode = await getUserRecoverCode(user.id);
	return { recoveryCode };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = event.locals;
		if (session === null || user === null) return fail(401, { message: 'Not authenticated' });

		if (!user.emailVerified || !user.registered2FA || !session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const currRecoveryCode = await getUserRecoverCode(user.id);
		const isValid = await updateUserRecoveryCode(user.id, currRecoveryCode);
		if (!isValid) return fail(400, { message: 'Invalid recovery code' });
	}
};
