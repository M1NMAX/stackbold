import { validatePasswordResetSessionRequest } from '$lib/server/password-reset';
import { redirect, type RequestEvent } from '@sveltejs/kit';

export async function load(event: RequestEvent) {
	const { session, user } = await validatePasswordResetSessionRequest(event);

	if (session === null) redirect(302, '/forgot-password');
	if (!session.emailVerified) redirect(302, '/reset-password/verify-email');
	if (!user.registered2FA) redirect(302, '/reset-password');
	if (session.twoFactorVerified) redirect(302, '/reset-password');

	return {};
}
