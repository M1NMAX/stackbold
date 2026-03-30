import { getContext, setContext } from 'svelte';
import { ModalState } from './index.js';
import type { ReadableBox } from '$lib/types.js';

interface AccordionStateOpts {
	isMulti: ReadableBox<boolean>;
}

interface AccordionItemOpts {
	id: ReadableBox<string>;
}

class AccordionState {
	readonly #opts: AccordionStateOpts;
	#children = new Map<string, ModalState>();

	constructor(opts: AccordionStateOpts) {
		this.#opts = opts;
	}

	addChild(opts: AccordionItemOpts) {
		this.#children.set(opts.id.current, new ModalState());
	}

	open(id: string) {
		const target = this.#children.get(id);
		if (target) target.open();

		if (this.#opts.isMulti.current) return;

		for (const key of this.#children.keys()) {
			if (key !== id) {
				this.#children.get(key)?.close();
			}
		}
	}

	openAll(value: string[]) {
		if (this.#opts.isMulti) return;

		for (const v of value) {
			this.open(v);
		}
	}

	close(id: string) {
		const target = this.#children.get(id);
		if (target) target.close();
	}

	isOpen(id: string) {
		const target = this.#children.get(id);
		if (!target) return false;

		return target.isOpen;
	}
}

const ACCORDION_CTX_KEY = Symbol('ACCORDION_CTX_KEY');

export function setAccordionState(opts: AccordionStateOpts) {
	return setContext(ACCORDION_CTX_KEY, new AccordionState(opts));
}

export function getAccordionState() {
	return getContext<ReturnType<typeof setAccordionState>>(ACCORDION_CTX_KEY);
}
