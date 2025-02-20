import { getContext, setContext, tick } from 'svelte';

const COMMAND_VALUE_ATTR = 'aria-activedescendant';
const COMMAND_ITEM_ATTR = '[role="option"]';

type Ref = HTMLDivElement | null;

class CommandItem {
	value: string;
	onselect?: () => void;
	render = $state(true);
	isSelected = $state(false);

	constructor(value: string, onselect?: () => void) {
		this.value = value;
		this.onselect = onselect;
	}
}

class CommandState {
	search = $state('');
	ref = $state<Ref>(null);
	hasResult = $state(true);
	#items = new Map<string, CommandItem>();
	#selectedItemId = '';

	constructor() {
		$effect(() => {
			this.#focusFirstItem();
			this.hasResult = true;
		});

		$effect(() => {
			const searchTerm = this.search.toLowerCase() || '';
			this.#items.forEach((item) => {
				item.render = item.value.toLowerCase().includes(searchTerm);
			});

			tick().then(() => this.#focusFirstItem());

			this.hasResult = this.#items.values().some((item) => item.render);
		});
	}

	setRef(ref: Ref) {
		this.ref = ref;
	}

	registerItem(id: string, value: string, onselect?: () => void) {
		this.#items.set(id, new CommandItem(value, onselect));
	}

	getItemById(id: string) {
		const target = this.#items.get(id);
		if (!target) throw new Error('Item not found, id: ' + id);
		return target;
	}

	setValue(id: string) {
		const target = this.#items.get(id);
		if (!target) throw new Error('Item not found, id: ' + id);

		this.#focus(document.getElementById(id) as Ref);
	}

	handleKeydown(e: KeyboardEvent) {
		if (!this.ref) return;

		const current = document.getElementById(this.#selectedItemId) as Ref;
		if (!current) return;
		let next = current;
		if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'j')) {
			e.preventDefault();
			next = current.nextElementSibling as HTMLDivElement;
		} else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'k')) {
			e.stopPropagation();
			e.preventDefault();
			next = current.previousElementSibling as HTMLDivElement;
		} else if (e.key === 'Enter') {
			const target = this.getItemById(this.#selectedItemId);
			if (target.onselect) target.onselect();
		}

		if (next) {
			this.#focus(next);
			this.#updScroll();
		}
	}

	handleInputKeydown(e: KeyboardEvent) {
		this.handleKeydown(e);
	}

	#defocus(element: Ref) {
		if (!element) return;
		element.ariaSelected = 'false';
		element.tabIndex = 0;
	}
	#focus(element: Ref) {
		if (!this.ref || !element) return;
		if (this.#selectedItemId) this.#defocus(document.getElementById(this.#selectedItemId) as Ref);
		element.ariaSelected = 'true';
		element.tabIndex = -1;
		this.ref.setAttribute(COMMAND_VALUE_ATTR, element.id);
		this.#selectedItemId = element.id;
	}

	#focusFirstItem() {
		if (!this.ref) return;
		this.ref.tabIndex = 0;

		const firstItem = this.ref.querySelector(COMMAND_ITEM_ATTR) as Ref;
		if (!firstItem) return;

		this.#focus(firstItem);
	}

	#updScroll() {
		if (!this.ref) return;
		const selectedItem = document.getElementById(this.#selectedItemId) as Ref;

		if (selectedItem) {
			selectedItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		}
	}
}

const COMMAND_CTX_KEY = Symbol('COMMAND_CTX_KEY');

export function setCommandState() {
	return setContext(COMMAND_CTX_KEY, new CommandState());
}

export function getCommandState() {
	return getContext<ReturnType<typeof setCommandState>>(COMMAND_CTX_KEY);
}
