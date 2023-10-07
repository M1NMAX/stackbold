import { lucia } from 'lucia';
import { prisma as prismaAdapter } from '@lucia-auth/adapter-prisma';
import { dev } from '$app/environment';
import { prisma } from '$lib/server/prisma';
import { sveltekit } from 'lucia/middleware';

export const auth = lucia({
	adapter: prismaAdapter(prisma),
	middleware: sveltekit(),
	env: dev ? 'DEV' : 'PROD',
	getUserAttributes: (userData) => {
		return {
			name: userData.name,
			email: userData.email,
			emailVerified: userData.email_verified
		};
	}
});

export type Auth = typeof auth;
