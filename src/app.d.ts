// See https://kit.svelte.dev/docs/types#app

import type { Template, Role } from '@prisma/client';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}

		// interface Platform {}
		interface Locals {
			user: import("lucia").User | null;
			session: import("lucia").Session | null;
		}
		// interface PageData {}
		interface PageState {
			template: Template;
		}
	}
}

/// <reference types='lucia' />
declare global {
	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth;
		type DatabaseUserAttributes = {
			name: string;
			email: string;
			email_verified: boolean;
			role: Role;
		};
		type DatabaseSessionAttributes = Record<string, never>;
	}
}

export { };
