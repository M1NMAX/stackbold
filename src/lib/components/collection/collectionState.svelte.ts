import type { RouterInputs } from '$lib/trpc/router';
import type { Collection } from '@prisma/client';
import { onError, redirectToast } from '../ui/sonner';
import { trpc } from '$lib/trpc/client';
import { toast } from 'svelte-sonner';
import { getContext, setContext } from 'svelte';

export class CollectionState {
	collections = $state<Collection[]>([]);

	constructor(collections: Collection[]) {
		this.collections = collections;
	}

	#getCollection(id: string) {
		return this.collections.find((collection) => collection.id === id) || null;
	}

	#updCollection(id: string, collection: Collection) {
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
				groupByConfigs: args.groupByConfigs || [],
				properties: [] // TODO: ref to support `properties`  value
			});
			const result = await trpc().collections.create.mutate({ ...args });
			this.#updCollection(tmpId, result);
			redirectToast('New collection created', `/collections/${result.id}`);
		} catch (err) {
			onError(err);
			this.#removeCollection(tmpId);
		}
	}

	async updCollection(args: RouterInputs['collections']['update']) {
		const { id, data } = args;
		let target = this.#getCollection(id);
		if (target == null) return;

		try {
			this.#updCollection(id, { ...target, ...data });
			await trpc().collections.update.mutate({ ...args });
		} catch (err) {
			onError(err);
			this.#updCollection(id, target);
		}
	}

	async deleteCollection(id: string) {
		let target = this.#getCollection(id);
		if (target == null) return;

		try {
			this.#removeCollection(id);
			await trpc().collections.delete.mutate(id);
			toast.success(`Collection [${target.name}] deleted successfully`);
		} catch (err) {
			onError(err);
			this.collections.push({ ...target });
		}
	}

	async refresh() {
		try {
			const result = await trpc().collections.list.query();
			this.collections = result;
		} catch (err) {
			onError(err);
		}
	}
}

const COLLECTION_STATE_CTX_KEY = Symbol('COLLECTION_STATE_CTX_KEY');

export function setCollectionState(collections: Collection[]) {
	return setContext(COLLECTION_STATE_CTX_KEY, new CollectionState(collections));
}

export function getCollectionState() {
	return getContext<ReturnType<typeof setCollectionState>>(COLLECTION_STATE_CTX_KEY);
}
