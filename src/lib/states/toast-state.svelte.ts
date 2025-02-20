import { DEFAULT_FEEDBACK_ERR_MESSAGE } from '$lib/constant';
import type { Toast } from '$lib/types';
import { getContext, onDestroy, setContext } from 'svelte';

type ActionToastArg = Omit<Extract<Toast, { type: 'action' }>, 'id' | 'type'>;

export class ToastState {
	toasts = $state<Toast[]>([]);
	toastToTimeoutMap = new Map<string, number>();

	constructor() {
		onDestroy(() => {
			for (const timeout of this.toastToTimeoutMap.values()) {
				clearTimeout(timeout);
				this.toastToTimeoutMap.clear();
			}
		});
	}

	addSuccessToast(message: string, durationMs = 3000) {
		this.#add({ message, type: 'success' }, durationMs);
	}

	addErrorToast(message: string | null = null, durationMs = 4500) {
		this.#add({ message: message ?? DEFAULT_FEEDBACK_ERR_MESSAGE, type: 'error' }, durationMs);
	}

	addWarningToast(message: string, durationMs = 4000) {
		this.#add({ message, type: 'warning' }, durationMs);
	}

	#add(toast: Omit<Exclude<Toast, { type: 'action' }>, 'id'>, durationMs = 4000) {
		const id = crypto.randomUUID();

		this.toasts.push({ id, ...toast });

		this.toastToTimeoutMap.set(
			id,
			window.setTimeout(() => {
				this.remove(id);
			}, durationMs)
		);
	}

	addActionToast(toast: ActionToastArg, durationMs = 4000) {
		const id = crypto.randomUUID();

		this.toasts.push({ id, type: 'action', ...toast });

		this.toastToTimeoutMap.set(
			id,
			window.setTimeout(() => {
				this.remove(id);
			}, durationMs)
		);
	}

	remove(id: string) {
		const timeout = this.toastToTimeoutMap.get(id);
		if (timeout) {
			clearTimeout(timeout);
			this.toastToTimeoutMap.delete(id);
		}

		this.toasts = this.toasts.filter((toast) => toast.id !== id);
	}
}

const TOAST_CTX_KEY = Symbol('TOAST_CTX_KEY');

export function setToastState() {
	return setContext(TOAST_CTX_KEY, new ToastState());
}

export function getToastState() {
	return getContext<ReturnType<typeof setToastState>>(TOAST_CTX_KEY);
}
