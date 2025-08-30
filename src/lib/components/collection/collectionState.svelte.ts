import type { RouterInputs } from '$lib/trpc/router';
import { trpc } from '$lib/trpc/client';
import { getContext, setContext } from 'svelte';
import { goto } from '$app/navigation';
import { getToastState } from '$lib/states';
import type { CollectionWithViews } from '$lib/types';

export class CollectionState {
	#toastState = getToastState();
	collections = $state<CollectionWithViews[]>([]);

	constructor(collections: CollectionWithViews[]) {
		this.collections = collections;
	}

	#getCollection(id: string) {
		return this.collections.find((collection) => collection.id === id) || null;
	}

	#updCollection(id: string, collection: CollectionWithViews) {
		this.collections = this.collections.map((c) => (c.id !== id ? c : collection));
	}

	#removeCollection(id: string) {
		this.collections = this.collections.filter((collection) => collection.id !== id);
	}

	async createCollection(args: RouterInputs['collections']['create']) {
		const tmpId = crypto.randomUUID();

		try {
			this.collections.push({
				id: tmpId,
				ownerId: tmpId,
				name: args.name,
				groupId: args.groupId || null,
				createdAt: new Date(),
				updatedAt: new Date(),
				icon: args.icon || 'folder',
				isDescHidden: args.isDescHidden || true,
				description: args.description || '',
				isPinned: args.isPinned || false,
				groupByConfigs: [],
				filterConfigs: [],
				views: []
			});

			const result = await trpc().collections.create.mutate({ ...args });
			this.#updCollection(tmpId, result);

			this.#toastState.action({
				message: 'New collection created',
				action: {
					label: 'Go',
					onclick: () => goto(`/collections/${result.id}`)
				}
			});
		} catch (err) {
			this.#toastState.error();
			this.#removeCollection(tmpId);
		}
	}

	async duplicateCollection(id: string) {
		const target = this.#getCollection(id);

		if (target == null) {
			this.#toastState.error();
			return;
		}

		try {
			const result = await trpc().collections.duplicate.mutate(id);
			this.collections.push({ ...result });

			this.#toastState.action({
				message: `Collection [${target.name}] duplicated successfully`,
				action: {
					label: 'Go',
					onclick: () => goto(`/collections/${result.id}`)
				}
			});
		} catch (err) {
			this.#toastState.error();
		}
	}

	async updCollection(args: RouterInputs['collections']['update']) {
		const { id, ...rest } = args;
		let target = this.#getCollection(id);
		if (target == null) {
			this.#toastState.error();
			return;
		}

		try {
			this.#updCollection(id, { ...target, ...rest });
			await trpc().collections.update.mutate({ ...args });
		} catch (err) {
			this.#toastState.error();
			this.#updCollection(id, target);
		}
	}

	async deleteCollection(id: string, redirect: boolean = false) {
		let target = this.#getCollection(id);
		if (target == null) {
			this.#toastState.error();
			return;
		}

		try {
			this.#removeCollection(id);
			await trpc().collections.delete.mutate(id);
			this.#toastState.success(`Collection [${target.name}] deleted successfully`);

			if (redirect) setTimeout(() => goto('/collections'), 500);
		} catch (err) {
			this.#toastState.error();
			this.collections.push({ ...target });
		}
	}

	async refresh() {
		try {
			this.collections = await trpc().collections.list.query();
		} catch (err) {
			this.#toastState.error();
		}
	}
}

const COLLECTION_STATE_CTX_KEY = Symbol('COLLECTION_STATE_CTX_KEY');

export function setCollectionState(collections: CollectionWithViews[]) {
	return setContext(COLLECTION_STATE_CTX_KEY, new CollectionState(collections));
}

export function getCollectionState() {
	return getContext<ReturnType<typeof setCollectionState>>(COLLECTION_STATE_CTX_KEY);
}
