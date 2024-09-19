import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { readable, type Readable } from 'svelte/store';

export function mediaQuery(initalValue: boolean, query: string) {
	return readable(initalValue, (set) => {
		const isSupported =
			browser && window && 'matchMedia' in window && typeof window.matchMedia === 'function';
		let mediaQuery: MediaQueryList | undefined;

		function cleanup() {
			if (!mediaQuery) return;
			if ('removeEventListener' in mediaQuery)
				// eslint-disable-next-line @typescript-eslint/no-use-before-define
				mediaQuery.removeEventListener('change', update);
			// @ts-expect-error deprecated API
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			else mediaQuery.removeListener(update);
		}

		function update() {
			if (!isSupported) return;

			cleanup();

			mediaQuery = window!.matchMedia(query);

			set(mediaQuery.matches);

			if ('addEventListener' in mediaQuery) mediaQuery.addEventListener('change', update);
			// @ts-expect-error deprecated API
			else mediaQuery.addListener(update);
		}

		update();
		return cleanup;
	});
}

const SCREEN_CTX = Symbol('SCREEN_CTX');
export function setScreenState(value: Readable<boolean>) {
	setContext(SCREEN_CTX, value);
	return value;
}

export function getScreenState() {
	return getContext<Readable<boolean>>(SCREEN_CTX);
}
