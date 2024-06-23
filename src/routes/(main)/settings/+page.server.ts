import { lucia } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

const updUserSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.string().email().nullable()
});

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) redirect(302, '/signin')

	const form = await superValidate(updUserSchema);

	return { user, form };
};
export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await lucia.invalidateSession(event.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});

		redirect(302, '/signin');
	},
	updUserData: async ({ request, locals }) => {
		const form = await superValidate(request, updUserSchema);

		if (!form.valid) return fail(400, { form });
		const { name } = form.data;

		// TODO: finish implementation
		return message(form, "Under implementation");
	}
};
