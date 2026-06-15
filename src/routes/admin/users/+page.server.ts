import type { Actions, PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { createCaller } from '$lib/trpc/router';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { createUserSchema } from '$lib/schema';
import { fail } from '@sveltejs/kit';
import { createUser, getUserByEmail } from '$lib/server/user';

export const load: PageServerLoad = async (event) => {
	const caller = createCaller(await createContext(event));

	const [form, users] = await Promise.all([
		superValidate(zod(createUserSchema)),
		caller.admin.listUsers()
	]);
	return { form, users };
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
