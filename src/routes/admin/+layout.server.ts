import { redirect } from '@sveltejs/kit';
import { Role } from '@prisma/client';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (event.locals.session === null || event.locals.user === null) redirect(302, '/signin');
	if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
	if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified)
		redirect(302, '/2fa');
	if (event.locals.user.role !== Role.ADMIN) redirect(302, '/');

	return { user: { ...event.locals.user, inAdmin: true } };
};
