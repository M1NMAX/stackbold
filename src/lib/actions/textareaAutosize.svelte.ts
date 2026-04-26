// BASED ON
// https://github.com/jackmoore/autosize/blob/master/src/autosize.js
// https://github.com/jesseskinner/svelte-autosize/blob/main/index.js
import { on } from 'svelte/events';

interface SetHeightOptions {
	restoreTextAlign: string | null;
	testForHeightReduction: boolean;
}

interface SavedStyles {
	height: string;
	resize: string;
	textAlign: string;
	overflowY: string;
	overflowX: string;
	overflowWrap: string;
}

export function autosizeTextarea(_id: string) {
	return (el: HTMLTextAreaElement) => autosize(el);
}

export function autosize(node: HTMLTextAreaElement) {
	const handleInput = (function () {
		let previousValue = node.value;

		return () => {
			setHeight(node, {
				testForHeightReduction: previousValue === '' || !node.value.startsWith(previousValue),
				restoreTextAlign: null
			});

			previousValue = node.value;
		};
	})();

	const originalStyles = {
		height: node.style.height,
		resize: node.style.resize,
		textAlign: node.style.textAlign,
		overflowY: node.style.overflowY,
		overflowX: node.style.overflowX,
		overflowWrap: node.style.overflowWrap
	};

	node.style.overflowX = 'hidden';
	node.style.overflowWrap = 'break-word';

	const off = on(node, 'input', handleInput);
	window.addEventListener('resize', () => fullSetHeight(node));

	fullSetHeight(node);

	return () => {
		off();
		window.removeEventListener('resize', () => fullSetHeight(node));
		(Object.keys(originalStyles) as (keyof SavedStyles)[]).forEach((key) => {
			node.style[key] = originalStyles[key];
		});
	};
}

function fullSetHeight(node: HTMLTextAreaElement) {
	setHeight(node, {
		restoreTextAlign: null,
		testForHeightReduction: true
	});
}

function setHeight(node: HTMLTextAreaElement, opts: SetHeightOptions) {
	let previousHeight: number | null = null;
	const computed = window.getComputedStyle(node);
	const initialOverflowY = computed.overflowY;

	if (node.scrollHeight === 0) return;

	if (computed.resize === 'vertical') {
		node.style.resize = 'none';
	} else if (computed.resize === 'both') {
		node.style.resize = 'horizontal';
	}

	let restoreScrollTops: (() => void) | undefined;

	if (opts.testForHeightReduction) {
		restoreScrollTops = cacheScrollTops(node);
		node.style.height = computed.minHeight;
	}

	let newHeight: number;

	if (computed.boxSizing === 'content-box') {
		newHeight =
			node.scrollHeight - (parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom));
	} else {
		newHeight =
			node.scrollHeight +
			parseFloat(computed.borderTopWidth) +
			parseFloat(computed.borderBottomWidth);
	}

	if (computed.maxHeight !== 'none' && newHeight > parseFloat(computed.maxHeight)) {
		if (computed.overflowY === 'hidden') {
			node.style.overflow = 'scroll';
		}
		newHeight = parseFloat(computed.maxHeight);
	} else if (computed.overflowY !== 'hidden') {
		node.style.overflow = 'hidden';
	}

	node.style.height = `${newHeight}px`;

	if (opts.restoreTextAlign) {
		node.style.textAlign = opts.restoreTextAlign;
	}

	if (restoreScrollTops) restoreScrollTops();

	if (previousHeight !== newHeight) {
		node.dispatchEvent(new Event('autosize:resized', { bubbles: true }));
		previousHeight = newHeight;
	}

	if (initialOverflowY !== computed.overflow && !opts.restoreTextAlign) {
		const textAlign = computed.textAlign;

		if (computed.overflow === 'hidden') {
			node.style.textAlign = textAlign === 'start' ? 'end' : 'start';
		}

		setHeight(node, {
			restoreTextAlign: textAlign,
			testForHeightReduction: true
		});
	}
}

function cacheScrollTops(el: Element): () => void {
	const arr: [Element, number][] = [];

	while (el && el.parentNode && el.parentNode instanceof Element) {
		if ((el.parentNode as Element & { scrollTop: number }).scrollTop) {
			arr.push([el.parentNode, (el.parentNode as HTMLElement).scrollTop]);
		}
		el = el.parentNode as Element;
	}

	return () =>
		arr.forEach(([node, scrollTop]) => {
			(node as HTMLElement).style.scrollBehavior = 'auto';
			(node as HTMLElement).scrollTop = scrollTop;
			(node as HTMLElement).style.scrollBehavior = '';
		});
}
