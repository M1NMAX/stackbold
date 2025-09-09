// See https://kit.svelte.dev/docs/types#app

import type { Collection, Session } from '@prisma/client';
import type { User } from '$lib/server/user.js';

// for information about these interfaces
declare global {
	var baseIdCounter: { current: number };
	namespace App {
		// interface Error {}

		// interface Platform {}
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		// interface PageData {}
		interface PageState {
			id?: string;
			insidePanel?: boolean;
			template?: Collection;
		}
	}
}

export {};
