import { collections } from '$lib/trpc/routes/collections';
import { groups } from '$lib/trpc/routes/groups';
import { items } from '$lib/trpc/routes/items';
import { properties } from '$lib/trpc/routes/properties';
import { templates } from '$lib/trpc/routes/templates';
import { users } from '$lib/trpc/routes/users';
import { views } from '$lib/trpc/routes/views';
import { t } from '$lib/trpc/t';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const router = t.router({
	collections,
	groups,
	items,
	properties,
	templates,
	users,
	views
});

export const createCaller = t.createCallerFactory(router);

export type Router = typeof router;

// types helpers
export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
