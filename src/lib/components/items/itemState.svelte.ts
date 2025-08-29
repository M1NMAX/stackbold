import type { RouterInputs } from '$lib/trpc/router';
import type { Item } from '@prisma/client';
import { trpc } from '$lib/trpc/client';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/states';

export class ItemState {
	#toastState = getToastState();
	items = $state<Item[]>([]);
	collectionId = $state('');

	constructor(items: Item[]) {
		this.items = items;
	}

	#updItem(id: string, item: Item) {
		this.items = this.items.map((it) => (it.id !== id ? it : item));
	}

	#removeItem(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}

	getItem(id: string) {
		return this.items.find((item) => item.id === id);
	}

	async createItem(args: RouterInputs['items']['create']) {
		const tmpId = crypto.randomUUID();

		try {
			this.items.push({
				id: tmpId,
				collectionId: args.collectionId,
				name: args.name,
				createdAt: new Date(),
				updatedAt: new Date(),
				properties: []
			});

			const createdItem = await trpc().items.create.mutate({ ...args });
			this.#updItem(tmpId, createdItem);
			return createdItem.id;
		} catch (err) {
			this.#toastState.error();
			this.#removeItem(tmpId);
		}
	}

	async updItem(args: RouterInputs['items']['update']) {
		const { id, ...rest } = args;
		const target = this.getItem(id);
		if (target == null) return;
		try {
			this.#updItem(id, { ...target, ...rest });
			await trpc().items.update.mutate(args);
		} catch (err) {
			this.#toastState.error();
			this.#updItem(id, target);
		}
	}

	async duplicateItem(id: string) {
		try {
			const createdItem = await trpc().items.duplicate.mutate(id);
			this.items.push({ ...createdItem });
		} catch (err) {
			this.#toastState.error();
		}
	}

	async deleteItem(id: string) {
		const target = this.getItem(id);
		if (target == null) return;

		try {
			this.#removeItem(id);
			await trpc().items.delete.mutate(id);

			this.#toastState.success('Item deleted successfully');
		} catch (err) {
			this.#toastState.error();
			this.items.push({ ...target });
		}
	}

	async updPropertyRef(id: string, ref: { id: string; value: string }) {
		const target = this.getItem(id);
		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		try {
			const refs = target.properties.map((ref) =>
				ref.id !== ref.id ? ref : { ...ref, value: ref.value }
			);

			const updatedItem = await trpc().items.updateRef.mutate({
				id,
				ref,
				cid: target.collectionId
			});

			this.#updItem(id, { ...updatedItem });
		} catch (err) {
			this.#toastState.error();
			this.#updItem(target.id, target);
		}
	}

	async refresh(viewShortId: number) {
		try {
			this.items = await trpc().items.list.query({
				collectionId: this.collectionId,
				viewShortId
			});
		} catch (err) {
			this.#toastState.error();
		}
	}
}

const ITEM_STATE_CTX_KEY = Symbol('ITEM_STATE_CTX_KEY');

export function setItemState(items: Item[]) {
	return setContext(ITEM_STATE_CTX_KEY, new ItemState(items));
}

export function getItemState() {
	return getContext<ReturnType<typeof setItemState>>(ITEM_STATE_CTX_KEY);
}
