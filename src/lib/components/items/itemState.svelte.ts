import type { RouterInputs } from '$lib/trpc/router';
import type { Item, PropertyRef } from '@prisma/client';
import { onError } from '$lib/components/feedback';
import { trpc } from '$lib/trpc/client';
import { toast } from 'svelte-sonner';
import { getContext, setContext } from 'svelte';

export class ItemState {
	items = $state<Item[]>([]);

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
			let properties: PropertyRef[] = [];

			if (args.properties) {
				properties = args.properties.map((property) => ({
					id: property.id,
					value: property.value ?? ''
				}));
			}

			this.items.push({
				id: tmpId,
				collectionId: args.collectionId,
				name: args.name,
				createdAt: new Date(),
				updatedAt: new Date(),
				properties: properties
			});

			const createdItem = await trpc().items.create.mutate({ ...args });
			this.#updItem(tmpId, createdItem);
		} catch (err) {
			onError(err);
			this.#removeItem(tmpId);
		}
	}

	async updItem(args: RouterInputs['items']['update']) {
		const { id, data } = args;
		const target = this.getItem(id);
		if (target == null) return;
		try {
			this.#updItem(id, { ...target, ...data });
			await trpc().items.update.mutate(args);
		} catch (err) {
			onError(err);
			this.#updItem(id, target);
		}
	}

	async duplicateItem(id: string) {
		const target = this.getItem(id);
		if (target == null) {
			onError({ msg: 'Invalid item' });
			return;
		}
		const tmpId = crypto.randomUUID();
		try {
			const { id: _, name, ...rest } = target;
			this.items.push({
				...rest,
				name: name + ' copy',
				id: tmpId,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const createdItem = await trpc().items.create.mutate({
				...rest,
				name: name + ' copy'
			});

			this.#updItem(tmpId, createdItem);

			toast.success(`Item [${name}] duplicated successfully `);
		} catch (err) {
			onError(err);
			this.#removeItem(tmpId);
		}
	}

	async deleteItem(id: string) {
		const target = this.getItem(id);
		if (target == null) return;

		try {
			this.#removeItem(id);
			await trpc().items.delete.mutate(id);

			toast.success('Item deleted successfully');
		} catch (err) {
			onError(err);
			this.items.push({ ...target });
		}
	}

	async addPropertyRef(id: string) {
		try {
			const ref = { id, value: '' };

			this.items = this.items.map((item) => {
				const refs = [...item.properties, ref];

				return { ...item, properties: refs };
			});

			await trpc().items.addProperty.mutate({
				property: ref,
				ids: this.items.map(({ id }) => id)
			});
		} catch (err) {
			onError(err);
		}
	}

	async updPropertyRef(id: string, propertyRef: { id: string; value: string }) {
		const target = this.getItem(id);
		if (!target) {
			onError({ msg: 'Invalid property' });
			return;
		}

		try {
			const propertiesRef = target.properties.map((ref) =>
				ref.id !== propertyRef.id ? ref : { ...ref, value: propertyRef.value }
			);

			this.#updItem(id, { ...target, properties: propertiesRef });

			await trpc().items.updateProperty.mutate({ id, property: propertyRef });
		} catch (err) {
			onError(err);
			this.#updItem(target.id, target);
		}
	}

	async deletePropertyRef(id: string) {
		try {
			this.items = this.items.map((item) => {
				const refs = item.properties.filter((ref) => ref.id !== id);

				return { ...item, properties: refs };
			});

			await trpc().items.deleteProperty.mutate({
				propertyId: id,
				ids: this.items.map(({ id }) => id)
			});
		} catch (err) {
			onError(err);
		}
	}

	async refresh(id: string) {
		try {
			const storedItems = await trpc().items.list.query(id);
			this.items = storedItems;
		} catch (err) {
			onError(err);
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
