import type { Actions, PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';

const signUpSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.string().email(),
	password: z.string().min(6).max(255),
	role: z.enum(['MEMBER', 'ADMIN'])
});

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.getSession();

	if (!session) redirect(302, '/signin');
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

		return message(form, 'Feature under revision');
	}
};
