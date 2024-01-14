import type { Actions, PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';

const signUpSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.string().email(),
	password: z.string().min(6).max(255),
	role: z.enum(['MEMBER', 'ADMIN'])
});

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth.validate();

	if (!session) redirect(302, '/login');
	if (session.user.role !== 'ADMIN') redirect(302, '/');

	const user = session.user;

	const form = await superValidate(signUpSchema);

	const users = await router.createCaller(await createContext(event)).users.list();

	return { form, users, user };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, signUpSchema);

		if (!form.valid) return fail(400, { form });

		const { name, email, password, role } = form.data;

		try {
			await auth.createUser({
				key: {
					providerId: 'email',
					providerUserId: email.toLowerCase(),
					password
				},
				attributes: {
					name,
					email: email.toLocaleLowerCase(),
					email_verified: true,
					role
				}
			});
		} catch (e) {
			// check for unique constraint error in user table
			if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
				return message(form, 'Username already taken');
			}
			return message(form, 'An unknown error occurred');
		}
	}
};
