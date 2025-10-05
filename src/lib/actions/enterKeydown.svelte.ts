import type { Action } from 'svelte/action';

type EnterKeydownAttributes = { onenterkey?: (event: CustomEvent) => void };
type EnterAction = Action<HTMLElement, any, EnterKeydownAttributes>;

export const enterKeydown: EnterAction = (element) => {
	function handleEnterdown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;

		const enterEvent = new CustomEvent('enterkey');
		element.dispatchEvent(enterEvent);
	}

	$effect(() => {
		document.addEventListener('keydown', handleEnterdown, true);

		return () => {
			document.removeEventListener('keydown', handleEnterdown, true);
		};
	});
};
