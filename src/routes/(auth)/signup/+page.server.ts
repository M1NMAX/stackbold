import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { dev } from '$app/environment';
import { signUpSchema } from '$lib/schema';
import { generateIdFromEntropySize } from 'lucia';
import { prisma } from '$lib/server/prisma';
import { hash } from "@node-rs/argon2"
import { lucia } from '$lib/server/auth';
import { Role } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
	// if (!dev) redirect(302, '/signin');

	const user = locals.user;
	if (user) {
		redirect(302, '/');
	}

	const form = await superValidate(signUpSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const form = await superValidate(request, signUpSchema);

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;


		// recommended minimum parameters
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		//TODO: check if username is already used
		//TODO: change name
		const createdUser = await prisma.user.create({
			data: {
				id: generateIdFromEntropySize(10),
				name: "ad",
				email: email,
				password: passwordHash
			}
		})

		const session = await lucia.createSession(createdUser.id, {
			role: createdUser.role
		});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});


		return message(form, 'A email verification link was sent to your inbox');
	}
};
