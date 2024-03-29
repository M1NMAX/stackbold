import type { Action } from 'svelte/action';

export type ClickOutsideAttributes = {
	'on:clickoutside'?: (event: CustomEvent) => void;
};

type ClickOutsideAction = Action<HTMLElement, any, ClickOutsideAttributes>;

export const clickOutside: ClickOutsideAction = (element) => {
	function handleClick(event: MouseEvent) {
		const targetEl = event.target as HTMLElement;

		if (element && !element.contains(targetEl)) {
			const clickOutsideEvent = new CustomEvent('clickoutside');
			element.dispatchEvent(clickOutsideEvent);
		}
	}

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
};
