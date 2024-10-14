// See https://kit.svelte.dev/docs/types#app

import type { Template } from '@prisma/client';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}

		// interface Platform {}
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
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
