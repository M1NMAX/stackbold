import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth.validate();

	if (!session) redirect(302, '/login');

	if (session.user.role !== 'ADMIN') redirect(302, '/');

	const user = session.user;

	return { user };
};
