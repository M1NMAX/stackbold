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
	default: async ({ request, cookies }) => {
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
		const createdUser = await prisma.user.create({
			data: {
				id: generateIdFromEntropySize(10),
				name: email.split("@")[0],
				email: email,
				password: passwordHash
			}
		})
		return message(form, 'A email verification code was sent to your account');
	}
};
