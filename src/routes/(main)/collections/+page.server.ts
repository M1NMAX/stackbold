import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => ({
	collections: router.createCaller(await createContext(event)).collections.getUserCollections()
});

const createCollectionSchema = z.object({
	name: z.string().min(1).max(6)
});

export const actions: Actions = {
	createCollection: async (event) => {
		const form = await superValidate(event.request, createCollectionSchema);

		if (!form.valid) return fail(400, { form });

		const data = form.data;
		router.createCaller(await createContext(event)).collections.createCollection(data);
	}
};
