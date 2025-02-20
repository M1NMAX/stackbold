<script lang="ts">
	import type { Align } from '$lib/types';
	import type { Snippet } from 'svelte';
	import { linear } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	type Props = {
		children: Snippet;
		offset?: number;
		align?: Align;
		class?: string;
	};

	let { children, offset = 0, align = 'center', class: className }: Props = $props();

	let triggerEl = $state<HTMLElement | null>(null);
	let tooltipEl = $state<HTMLElement | null>(null);
	let visible = $state(false);
	let positioned = $state(false);

	let hideTimeoutId: ReturnType<typeof setTimeout> | undefined;

	function showTooltip() {
		visible = true;
		setTimeout(() => {
			positionTooltip();
			positioned = true;
		}, 0);
	}

	function hideTooltip() {
		visible = false;
		positioned = false;
	}
	function onPopoverEnter() {
		if (hideTimeoutId !== undefined) {
			clearTimeout(hideTimeoutId);
			hideTimeoutId = undefined;
		}
	}

	function onPopoverLeave() {
		hideTooltip();
	}

	function onTriggerLeave() {
		hideTimeoutId = setTimeout(hideTooltip, 100);
	}

	function positionTooltip() {
		if (!triggerEl || !tooltipEl) return;

		const referenceRect = triggerEl.getBoundingClientRect();
		const tooltipRect = tooltipEl.getBoundingClientRect();

		const scrollX = window.scrollX | document.documentElement.scrollLeft;
		const scrollY = window.scrollY | document.documentElement.scrollTop;

		let top, left;

		top = referenceRect.bottom + scrollY - 15 + offset;

		switch (align) {
			case 'start':
				left = referenceRect.left + scrollX;
				break;

			case 'center':
				left = referenceRect.left + scrollX + referenceRect.width / 2 - tooltipRect.width / 2;
				break;

			case 'end':
				left = referenceRect.right + scrollX - tooltipRect.width;
				break;
		}

		if (top + tooltipRect.height > window.innerHeight) {
			top = referenceRect.top + scrollY - tooltipRect.height - 25 + offset;
		}

		if (left + tooltipRect.width > window.innerWidth) {
			if (align === 'start') {
				left = referenceRect.right + scrollX - tooltipRect.width;
			} else if (align === 'end') {
				left = referenceRect.left + scrollX;
			}
		}

		tooltipEl.style.top = `${top}px`;
		tooltipEl.style.left = `${left}px`;
	}

	$effect(() => {
		function updTooptipPostion() {
			if (visible) positionTooltip();
		}

		window.addEventListener('resize', updTooptipPostion);
		window.addEventListener('scroll', updTooptipPostion, true);

		return () => {
			window.removeEventListener('resize', updTooptipPostion);
			window.removeEventListener('scroll', updTooptipPostion, true);

			if (hideTimeoutId !== undefined) {
				clearTimeout(hideTimeoutId);
			}
		};
	});
</script>

<button
	bind:this={triggerEl}
	onmouseenter={showTooltip}
	onmouseleave={onTriggerLeave}
	class="bg-green-500 p-1 rounded-md"
>
	Trigger
</button>

{#if visible}
	<div
		role="tooltip"
		bind:this={tooltipEl}
		transition:fade={{ duration: 100, easing: linear }}
		onmouseenter={onPopoverEnter}
		onmouseleave={onPopoverLeave}
		class={[
			'absolute p-1 rounded-sm bg-background transition-opacity duration-200',
			positioned ? 'visible opacity-100' : 'invisible opacity-0',
			className
		]}
	>
		{@render children()}
	</div>
{/if}
