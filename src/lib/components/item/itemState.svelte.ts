import type { RouterInputs } from '$lib/trpc/router';
import type { Item, PropertyRef } from '@prisma/client';
import { trpc } from '$lib/trpc/client';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/states/index.js';
import type { Nullable } from '$lib/types.js';
import { getTRPCErrorMsg } from '$lib/utils/index.js';

export class ItemState {
	#toastState = getToastState();
	items = $state<Item[]>([]);
	active = $state<Nullable<string>>(null);
	collectionId = $state('');
	viewShortId = $state(0);

	#pending = new Set<string>();
	#inFlight = new Set<string>();
	#isFlushScheduled = false;

	constructor(items: Item[]) {
		this.items = items;
	}

	#updItem(id: string, item: Item) {
		this.items = this.items.map((it) => (it.id !== id ? it : item));
	}

	#removeItem(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}

	#addItemSkeleton(id: string) {
		const date = new Date();
		return {
			id,
			name: '',
			collectionId: this.collectionId,
			createdAt: date,
			updatedAt: date,
			properties: []
		};
	}

	#flush = () => {
		const ids = [...this.#pending];
		this.#pending.clear();
		this.#isFlushScheduled = false;
		if (!ids.length) return;

		const CHUNK = 150;
		for (let i = 0; i < ids.length; i += CHUNK) {
			const chunk = ids.slice(i, i + CHUNK);
			chunk.forEach((id) => this.#inFlight.add(id));

			trpc()
				.items.batch.query(chunk)
				.then((response) => {
					response.forEach((item) => this.#updItem(item.id, item));
				})
				.catch((error) => {
					this.#toastState.error(getTRPCErrorMsg(error));
				})
				.finally(() => {
					chunk.forEach((id) => this.#inFlight.delete(id));
				});
		}
	};

	#scheduleFlush() {
		if (this.#isFlushScheduled) return;
		this.#isFlushScheduled = true;
		setTimeout(this.#flush, 0);
	}

	requestItem(id: string) {
		const target = this.getItem(id);
		if (!target) this.items.push(this.#addItemSkeleton(id));
		if (this.#pending.has(id) || this.#inFlight.has(id)) return;

		this.#pending.add(id);
		this.#scheduleFlush();
	}

	getItem(id: string) {
		return this.items.find((item) => item.id === id);
	}

	async createItem(args: RouterInputs['items']['create'], refresh: boolean = true) {
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
			if (refresh) await this.refresh(this.viewShortId);
			return createdItem.id;
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.#removeItem(tmpId);
		}

		return null;
	}

	async updItem(args: RouterInputs['items']['update'], refresh: boolean = false) {
		const { id, ...rest } = args;
		const target = this.getItem(id);
		if (!target) return;
		try {
			this.#updItem(id, { ...target, ...rest });
			await trpc().items.update.mutate(args);
			if (refresh) await this.refresh(this.viewShortId);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.#updItem(id, target);
		}
	}

	async duplicateItem(id: string, refresh: boolean = false) {
		try {
			const createdItem = await trpc().items.duplicate.mutate(id);
			this.items.push({ ...createdItem });
			if (refresh) await this.refresh(this.viewShortId);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
		}
	}

	async deleteItem(id: string) {
		const target = this.getItem(id);
		if (!target) return;

		try {
			this.#removeItem(id);
			await trpc().items.delete.mutate(id);

			this.#toastState.success('Item deleted successfully');
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.items.push({ ...target });
		}
	}

	async updPropertyRef(id: string, ref: PropertyRef, refresh: boolean = false) {
		const target = this.getItem(id);
		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		try {
			const updatedItem = await trpc().items.updateRef.mutate({
				cid: target.collectionId,
				id,
				ref
			});

			this.#updItem(id, { ...updatedItem });

			if (refresh) await this.refresh(this.viewShortId);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.#updItem(target.id, target);
		}
	}

	async refresh(viewShortId: number) {
		try {
			this.items = await trpc().items.list.query({
				collectionId: this.collectionId,
				viewShortId
			});
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
		}
	}

	async generatePresignedUrl(id: string, pid: string, filename: string) {
		return await trpc().items.fileUploadUrl.mutate({ id, pid, filename });
	}

	async getDownloadUrl(id: string, pid: string, filename: string) {
		return await trpc().items.fileDownloadUrl.mutate({ id, pid, filename });
	}

	async deleteFile(id: string, pid: string, filename: string) {
		return await trpc().items.deleteFile.mutate({ id, pid, filename });
	}
}

export const ITEM_STATE_CTX_KEY = Symbol('ITEM_STATE_CTX_KEY');

export function setItemState(items: () => Item[]) {
	return setContext(ITEM_STATE_CTX_KEY, new ItemState(items()));
}

export function getItemState() {
	return getContext<ReturnType<typeof setItemState>>(ITEM_STATE_CTX_KEY);
}
