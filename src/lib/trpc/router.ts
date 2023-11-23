import { collections } from '$lib/trpc/routes/collections';
import { groups } from './routes/groups';
import { items } from '$lib/trpc/routes/items';
import { t } from '$lib/trpc/t';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const router = t.router({
	collections,
	groups,
	items
});

export type Router = typeof router;

// types helpers
export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
