import { getContext, setContext } from 'svelte';
import { ModalState } from './index.js';

export type AccordionProps =
	| { type: 'single'; value?: string }
	| {
			type: 'multiple';
			value?: string[];
	  };

class AccordionState {
	#args: AccordionProps;
	#children = new Map<string, ModalState>();

	constructor(args: AccordionProps) {
		this.#args = args;

		$effect(() => {
			if (args.type === 'multiple') {
				if (args.value)
					args.value.forEach((value) => {
						const child = this.#children.get(value);
						if (child) child.open();
					});
			} else {
				if (args.value) {
					const target = this.#children.get(args.value);
					if (target) target.open();
				}
			}
		});
	}

	addChild(id: string) {
		this.#children.set(id, new ModalState());
	}

	open(id: string) {
		const target = this.#children.get(id);
		if (target) target.open();

		if (this.#args.type === 'single') {
			for (const key of this.#children.keys()) {
				if (key !== id) {
					this.#children.get(key)?.close();
				}
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

export function setAccordionState(args: AccordionProps) {
	return setContext(ACCORDION_CTX_KEY, new AccordionState(args));
}

export function getAccordionState() {
	return getContext<ReturnType<typeof setAccordionState>>(ACCORDION_CTX_KEY);
}
