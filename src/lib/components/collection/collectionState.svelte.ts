import type { RouterInputs } from '$lib/trpc/router';
import {
	Aggregator,
	Color,
	PropertyType,
	type Collection,
	type FilterConfig,
	type Property
} from '@prisma/client';
import { onError, redirectToast } from '$lib/components/feedback';
import { trpc } from '$lib/trpc/client';
import { toast } from 'svelte-sonner';
import { getContext, setContext } from 'svelte';
import { goto } from '$app/navigation';

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
			let properties: Property[] = [];

			if (args.properties) {
				properties = args.properties.map((property) => ({
					createdAt: new Date(),
					id: property.id || crypto.randomUUID(),
					name: property.name,
					type: property.type || PropertyType.TEXT,
					visibleInViews: property.visibleInViews || [],
					aggregator: property.aggregator || Aggregator.NONE,
					defaultValue: property.defaultValue || '',
					options: !property.options
						? []
						: property.options.map((opt) => ({
								id: opt.id || crypto.randomUUID(),
								value: opt.value,
								color: opt.color || Color.GRAY
							}))
				}));
			}

			let filterConfigs: FilterConfig[] = [];

			if (args.filterConfigs) {
				filterConfigs = args.filterConfigs.map((config) => ({
					view: config.view,
					filters: config.filters || []
				}));
			}

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
				filterConfigs: filterConfigs,
				properties: properties
			});
			const result = await trpc().collections.create.mutate({ ...args });
			this.#updCollection(tmpId, result);
			redirectToast('New collection created', `/collections/${result.id}`);
		} catch (err) {
			onError(err);
			this.#removeCollection(tmpId);
		}
	}

	async duplicateCollection(id: string) {
		const target = this.#getCollection(id);
		if (!target) {
			onError({ msg: 'collection state: Invalid collection' }, 'Selection invalid collection');
			return;
		}

		const { id: _, ownerId, name, ...rest } = target;

		try {
			const result = await trpc().collections.create.mutate({
				...rest,
				name: name + ' copy'
			});

			this.collections.push({ ...result });

			const items = await trpc().items.list.query(id);

			if (items.length > 0) {
				await trpc().items.createMany.mutate(
					items.map(({ id, collectionId, ...rest }) => ({
						collectionId: result.id,
						...rest
					}))
				);
			}

			redirectToast(`Collection [${name}] duplicated successfully`, `/collections/${result.id}`);
		} catch (err) {
			onError(err);
			// TODO: consider possible fallback
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

	async deleteCollection(id: string, redirect: boolean = false) {
		let target = this.#getCollection(id);
		if (target == null) return;

		try {
			this.#removeCollection(id);
			await trpc().collections.delete.mutate(id);
			toast.success(`Collection [${target.name}] deleted successfully`);

			if (redirect) setTimeout(() => goto('/collections'), 500);
		} catch (err) {
			onError(err);
			this.collections.push({ ...target });
		}
	}

	async refresh() {
		try {
			this.collections = await trpc().collections.list.query();
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
