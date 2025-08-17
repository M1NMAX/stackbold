import { DEFAULT_VIEW_SHORT_ID } from '$lib/constant/index.js';
import { getToastState } from '$lib/states/index.js';
import { trpc } from '$lib/trpc/client';
import type { RouterInputs } from '$lib/trpc/router';
import { capitalizeFirstLetter } from '$lib/utils/index.js';
import type { View, ViewType } from '@prisma/client';
import { getContext, setContext } from 'svelte';

export class ViewState {
	#toastState = getToastState();
	views = $state<View[]>([]);
	collectionId = $state('');
	viewShortId = $state(DEFAULT_VIEW_SHORT_ID);

	constructor(views: View[]) {
		this.views = views;
	}

	#getView(id: string) {
		return this.views.find((view) => view.id === id);
	}

	#updView(id: string, view: View) {
		this.views = this.views.map((v) => (v.id !== id ? v : view));
	}
	#removeView(id: string) {
		this.views = this.views.filter((v) => v.id !== id);
	}

	async addView(type: ViewType) {
		const tmpId = crypto.randomUUID();

		try {
			const name = capitalizeFirstLetter(type);

			this.views.push({
				id: tmpId,
				name: capitalizeFirstLetter(type),
				type,
				shortId: this.views.length + 1,
				order: this.views.length + 1,
				collectionId: this.collectionId,
				properties: [],
				filters: [],
				sorts: [],
				groupBy: null,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const view = await trpc().views.create.mutate({
				name,
				type,
				collectionId: this.collectionId
			});

			this.#updView(tmpId, view);
		} catch (error) {
			this.#toastState.error();
			this.#removeView(tmpId);
		}
	}

	async duplicateView(id: string) {
		const target = this.#getView(id);

		if (!target) {
			this.#toastState.error();
			return;
		}

		const tmpId = crypto.randomUUID();

		try {
			const { id: _1, createdAt: _2, updatedAt: _3, shortId: _4, ...rest } = target;
			const name = rest.name + ' copy';

			this.views.push({
				...rest,
				name,
				id: tmpId,
				shortId: this.views.length + 1,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const view = await trpc().views.create.mutate({
				...rest,
				name
			});

			this.#updView(tmpId, view);
		} catch (error) {
			this.#toastState.error();
			this.#removeView(tmpId);
		}
	}

	async updView(args: RouterInputs['views']['update']) {
		const { id, ...rest } = args;
		const target = this.#getView(id);

		if (!target) {
			this.#toastState.error();
			return;
		}

		try {
			this.#updView(id, { ...target, ...rest });
			await trpc().views.update.mutate({ ...args });
		} catch (err) {
			this.#toastState.error();
		}
	}
	async orderView(start: number, end: number) {
		if (start === end) return;
		await trpc().views.order.mutate({ collectionId: this.collectionId, start, end });
		await this.refresh();
	}

	async deleteView(id: string) {
		const target = this.#getView(id);

		if (!target) {
			this.#toastState.error();
			return;
		}

		try {
			this.#removeView(id);
			await trpc().views.delete.mutate(id);
		} catch (error) {
			this.#toastState.error();
		}
	}

	async refresh() {
		this.views = await trpc().views.list.query(this.collectionId);
	}
}

const VIEW_STATE_CTX_KEY = Symbol('VIEW_STATE_CTX_KEY');

export function setViewState(views: View[]) {
	return setContext(VIEW_STATE_CTX_KEY, new ViewState(views));
}

export function getViewState() {
	return getContext<ReturnType<typeof setViewState>>(VIEW_STATE_CTX_KEY);
}
