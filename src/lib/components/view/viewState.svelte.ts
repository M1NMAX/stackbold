import { BASE_FIELDS } from '$lib/constant/index.js';
import { getToastState } from '$lib/states/index.js';
import { trpc } from '$lib/trpc/client';
import type { RouterInputs } from '$lib/trpc/router';
import { capitalizeFirstLetter, getTRPCErrorMsg, omit } from '$lib/utils/index.js';
import type { View, ViewType } from '@prisma/client';
import { getContext, setContext } from 'svelte';

export class ViewState {
	#toastState = getToastState();
	collectionId = $state('');
	views = $state<View[]>([]);
	viewShortId = $state(0);

	constructor(views: View[], viewShortId: number) {
		this.views = views;
		this.viewShortId = viewShortId;
	}

	getViewByShortId(id: number) {
		return this.views.find((view) => view.shortId === id);
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
			const order = this.views.length + 1;
			const date = new Date();

			this.views.push({
				id: tmpId,
				name: capitalizeFirstLetter(type),
				type,
				shortId: order,
				order: order,
				collectionId: this.collectionId,
				properties: [],
				filters: [],
				sorts: [],
				createdAt: date,
				updatedAt: date,
				groupBy: null,
				hideEmptyGroups: null,
				hideItemCounts: null
			});

			const view = await trpc().views.create.mutate({
				name,
				type,
				collectionId: this.collectionId
			});

			this.#updView(tmpId, view);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
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
			const rest = omit(target, [...BASE_FIELDS, 'shortId']);
			const name = rest.name + ' copy';
			const date = new Date();

			this.views.push({
				...rest,
				name,
				id: tmpId,
				shortId: this.views.length + 1,
				createdAt: date,
				updatedAt: date
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
		const target = this.#getView(args.id);

		if (!target) {
			this.#toastState.error();
			return;
		}

		try {
			const view = await trpc().views.update.mutate({ ...args });
			this.#updView(args.id, view);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
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
			this.#toastState.error(getTRPCErrorMsg(error));
			this.views.push({ ...target });
		}
	}

	async refresh() {
		this.views = await trpc().views.list.query(this.collectionId);
	}
}

const VIEW_STATE_CTX_KEY = Symbol('VIEW_STATE_CTX_KEY');

export function setViewState(views: () => View[], viewShortId: () => number) {
	return setContext(VIEW_STATE_CTX_KEY, new ViewState(views(), viewShortId()));
}

export function getViewState() {
	return getContext<ReturnType<typeof setViewState>>(VIEW_STATE_CTX_KEY);
}
