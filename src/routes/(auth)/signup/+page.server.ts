import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { signUpSchema } from '$lib/schema';
import { generateIdFromEntropySize } from 'lucia';
import { prisma } from '$lib/server/prisma';
import { hash } from '@node-rs/argon2';
import { lucia } from '$lib/server/auth';
import { generateEmailVerificationCode, sendEmailVerificationCode } from '$lib/server/email';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (user) {
		redirect(302, '/');
	}

	const form = await superValidate(zod(signUpSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(signUpSchema));

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
				id: generateIdFromEntropySize(10), // 16 characters long
				name: email.split('@')[0],
				email: email,
				password: passwordHash
			}
		});

		const verficationCode = await generateEmailVerificationCode(createdUser.id, email);
		await sendEmailVerificationCode(email, verficationCode);
		const session = await lucia.createSession(createdUser.id, {
			role: createdUser.role
		});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/email-verification');
	}
};
