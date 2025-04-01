<script lang="ts">
	import type { Align, ParamsType, TransitionFun } from '$lib/types';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { linear } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { escapeKeydown } from '$lib/actions';
	import { tm } from '$lib/utils/index.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		triggerBy: string;
		visible: boolean;
		children: Snippet;
		offset?: number;
		align?: Align;
		sameWidth?: boolean;
		transition?: TransitionFun;
		params?: ParamsType;
	};

	let {
		triggerBy,
		visible = $bindable(),
		children,
		offset = 0,
		align = 'center',
		sameWidth = false,
		class: className,
		transition = fade,
		params,
		...rest
	}: Props = $props();

	const defaultParams: ParamsType = { duration: 100, easing: linear };

	let triggerEl = $state<HTMLElement | null>(null);
	let contentEl = $state<HTMLElement | null>(null);

	function show() {
		setTimeout(() => {
			setContentPosition();
		}, 0);
	}

	function hide() {
		visible = false;
	}

	function setContentPosition() {
		if (!triggerEl || !contentEl) return;

		const referenceRect = triggerEl.getBoundingClientRect();
		const contentRect = contentEl.getBoundingClientRect();

		const scrollX = window.scrollX | document.documentElement.scrollLeft;
		const scrollY = window.scrollY | document.documentElement.scrollTop;

		let top, left;

		top = referenceRect.bottom + scrollY + offset;

		switch (align) {
			case 'start':
				left = referenceRect.left + scrollX;
				break;

			case 'center':
				left = referenceRect.left + scrollX + referenceRect.width / 2 - contentRect.width / 2;
				break;

			case 'end':
				left = referenceRect.right + scrollX - contentRect.width;
				break;
		}

		if (top + contentRect.height > window.innerHeight) {
			top = referenceRect.top + scrollY - contentRect.height + offset;
		}

		if (left + contentRect.width > window.innerWidth) {
			if (align === 'start') {
				left = referenceRect.right + scrollX - contentRect.width;
			} else if (align === 'end') {
				left = referenceRect.left + scrollX;
			}
		}

		contentEl.style.top = `${top}px`;
		contentEl.style.left = `${left}px`;
		if (sameWidth) contentEl.style.width = `${referenceRect.width}px`;
	}

	$effect(() => {
		if (visible) show();
	});

	$effect(() => {
		triggerEl = document.getElementById(triggerBy);

		function updContentPosition() {
			if (visible) setContentPosition();
		}

		window.addEventListener('resize', updContentPosition);
		window.addEventListener('scroll', updContentPosition, true);

		return () => {
			window.removeEventListener('resize', updContentPosition);
			window.removeEventListener('scroll', updContentPosition, true);
		};
	});
</script>

{#if visible}
	<div role="presentation" class="fixed top-0 start-0 z-50 w-full h-full" onclick={hide}></div>
	<div
		tabindex="-1"
		role="menu"
		bind:this={contentEl}
		transition:transition={params || defaultParams}
		use:escapeKeydown
		onescapekey={hide}
		class={tm(
			'fixed z-50 flex flex-col p-1 min-w-[15rem] rounded-md bg-background text-secondary-foreground',
			className
		)}
		{...rest}
	>
		{@render children()}
	</div>
{/if}
