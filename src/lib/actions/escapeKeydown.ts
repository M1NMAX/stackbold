import type { Action } from 'svelte/action';

export type EscapeKeydownAttributes = { onescapekey?: (event: CustomEvent) => void };
type EscapeAction = Action<HTMLElement, any, EscapeKeydownAttributes>;

export const escapeKeydown: EscapeAction = (element) => {
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			const escapeEvent = new CustomEvent('onescapekey');
			element.dispatchEvent(escapeEvent);
		}
	}

	document.addEventListener('keydown', handleKeydown, true);

	return {
		destroy() {
			document.removeEventListener('keydown', handleKeydown, true);
		}
	};
};
