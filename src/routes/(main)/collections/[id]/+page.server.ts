import type { Actions, PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

const createItemSchema = z.object({
	name: z
		.string()
		.min(1, { message: 'The name must be at least 1 character long' })
		.max(100, { message: 'The name must be at most 20 characters long' }),
	collectionId: z.string(),
	properties: z.array(z.object({ id: z.string(), value: z.string() }))
});

export const load: PageServerLoad = async (event) => {
	const id = event.params.id;

	const form = await superValidate(zod(createItemSchema));

	return {
		collection: await router.createCaller(await createContext(event)).collections.load(id),
		items: await router.createCaller(await createContext(event)).items.list(id),
		form
	};
};

export const actions: Actions = {
	createItem: async (event) => {
		const form = await superValidate(event.request, zod(createItemSchema));

		try {
			await router.createCaller(await createContext(event)).items.create(form.data);
		} catch (error) {
			return message(form, 'Something went error');
		}
	}
};
