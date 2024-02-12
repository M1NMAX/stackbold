// See https://kit.svelte.dev/docs/types#app

import type { Template, Role } from '@prisma/client';
import { SupabaseClient, Session } from '@supabase/supabase-js';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}

		// interface Platform {}
		interface Locals {
			supabase: SupabaseClient;
			getSession(): Promise<Session | null>;
		}
		interface PageData {
			session: Session | null;
		}
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

export {};
