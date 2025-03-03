import type { Action } from 'svelte/action';

export type ClickOutsideAttributes = {
	onclickoutside?: (event: CustomEvent) => void;
};

type ClickOutsideAction = Action<HTMLElement, any, ClickOutsideAttributes>;

export const clickOutside: ClickOutsideAction = (element) => {
	function handleClick(event: MouseEvent) {
		const targetEl = event.target as HTMLElement;

		if (element && !element.contains(targetEl)) {
			element.dispatchEvent(new CustomEvent('clickoutside', { detail: event }));
		}
	}

	$effect(() => {
		document.addEventListener('click', handleClick, true);

		return () => {
			document.removeEventListener('click', handleClick, true);
		};
	});
};
