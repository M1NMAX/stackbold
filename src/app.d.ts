// See https://kit.svelte.dev/docs/types#app

import type { Session, Template } from '@prisma/client';
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
			showPanel?: boolean;
			template?: Template;
		}
	}
}

export {};
