import type { Actions, PageServerLoad } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { createUser, getUserByEmail } from '$lib/server/user';
import { Role } from '@prisma/client';
import { createUserSchema } from '$lib/schema';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;

	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');
	if (user.role !== Role.ADMIN) redirect(302, '/');

	const [form, users] = await Promise.all([
		superValidate(zod(createUserSchema)),
		createCaller(await createContext(event)).users.list()
	]);

	// const form = await superValidate(zod(createUserSchema)) ;

	// const users = await createCaller(await createContext(event)).users.list();

	return { form, users, user };
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
