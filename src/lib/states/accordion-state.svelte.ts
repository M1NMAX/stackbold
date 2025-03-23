import { getContext, setContext } from 'svelte';
import { ModalState } from './index.js';

class AccordionState {
	#isMulti: boolean;
	#children = new Map<string, ModalState>();

	constructor(isMulti: boolean) {
		this.#isMulti = isMulti;
	}

	addChild(id: string) {
		this.#children.set(id, new ModalState());
	}

	open(id: string) {
		const target = this.#children.get(id);
		if (target) target.open();

		if (!this.#isMulti) {
			for (const key of this.#children.keys()) {
				if (key !== id) {
					this.#children.get(key)?.close();
				}
			}
		}
	}

	openAll(value: string[]) {
		if (this.#isMulti) {
			for (const v of value) {
				this.open(v);
			}
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

export function setAccordionState(isMulti: boolean) {
	return setContext(ACCORDION_CTX_KEY, new AccordionState(isMulti));
}

export function getAccordionState() {
	return getContext<ReturnType<typeof setAccordionState>>(ACCORDION_CTX_KEY);
}
