import type { Actions, PageServerLoad } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { createUser, getUserByEmail } from '$lib/server/user';
import { Role } from '@prisma/client';
import { createUserSchema } from '$lib/schema';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session === null || event.locals.user === null) redirect(302, '/signin');
	if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
	if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified)
		redirect(302, '/2fa');

	if (event.locals.user.role !== Role.ADMIN) redirect(302, '/');

	const form = await superValidate(zod(createUserSchema));

	const users = await prisma.user.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			role: true,
			createdAt: true,
			updatedAt: true,
			password: false
		}
	});

	return { form, users, user: event.locals.user };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(createUserSchema));

		if (!form.valid) return fail(400, { form });

		const { name, email, password, role } = form.data;

		const storedUser = await getUserByEmail(email);
		if (storedUser) return setError(form, 'email', 'E-mail already exists.');

		await createUser({ name, email, password, role });

		return message(form, 'Feature under revision');
	}
};
