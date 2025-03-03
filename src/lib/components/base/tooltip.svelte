<script lang="ts">
	import type { Align, Placement } from '$lib/types';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { linear } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { tm } from '$lib/utils/index.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		triggerBy: string;
		children: Snippet;
		offset?: number;
		align?: Align;
		placement?: Placement;
		arrow?: boolean;
	};

	let {
		triggerBy,
		children,
		offset = 0,
		align = 'center',
		placement = 'top',
		arrow = true,
		class: className,
		...rest
	}: Props = $props();

	let visible = $state(false);
	let positioned = $state(false);

	let tooltipEl = $state<HTMLElement | null>(null);
	let arrowEl = $state<HTMLElement | null>(null);
	let triggerEl: HTMLElement | null = null;

	let hideTimoutId: ReturnType<typeof setTimeout> | undefined;

	function show() {
		visible = true;
		setTimeout(() => {
			setTooltipPosition();
			positioned = true;
		}, 0);
	}

	function hide() {
		visible = false;
		positioned = false;
	}

	function onTooltipEnter() {
		if (hideTimoutId !== undefined) {
			clearTimeout(hideTimoutId);
			hideTimoutId = undefined;
		}
	}

	function onTooltipLeave() {
		hide();
	}

	function onTriggerLeave() {
		hideTimoutId = setTimeout(hide, 100);
	}
	function setTooltipPosition() {
		if (!tooltipEl || !triggerEl) return;

		const refRect = triggerEl.getBoundingClientRect();
		const tooltipRect = tooltipEl.getBoundingClientRect();
		const arrowRect = arrow && arrowEl ? arrowEl.getBoundingClientRect() : null;

		const scrollX = window.scrollX || document.documentElement.scrollLeft;
		const scrollY = window.scrollX || document.documentElement.scrollTop;

		let top, left, arrowTop, arrowLeft;

		switch (placement) {
			case 'top':
				top = refRect.top + scrollY - tooltipRect.height - 10 - offset;
				left = refRect.left + scrollX + refRect.width / 2 - tooltipRect.width / 2;
				if (arrowRect && offset === 0) {
					arrowTop = tooltipRect.height - 5;
					arrowLeft = tooltipRect.width / 2 - arrowRect.width / 2;
				}
				break;

			case 'bottom':
				top = refRect.bottom + scrollY + 10 + offset;
				left = refRect.left + scrollX + refRect.width / 2 - tooltipRect.width / 2;
				if (arrowRect && offset === 0) {
					arrowTop = -arrowRect.height + 9;
					arrowLeft = tooltipRect.width / 2 - arrowRect.width / 2;
				}
				break;
			case 'right':
				top = refRect.top + scrollY + refRect.height / 2 - tooltipRect.height / 2;
				left = refRect.right + scrollX + 10 + offset;
				if (arrowRect && offset === 0) {
					arrowTop = tooltipRect.height / 2 - arrowRect.height / 2;
					arrowLeft = -arrowRect.width / 2 + 2;
				}
				break;
			case 'left':
				top = refRect.top + scrollY + refRect.height / 2 - tooltipRect.height / 2;
				left = refRect.left + scrollX - tooltipRect.width - 10 - offset;
				if (arrowRect && offset === 0) {
					arrowTop = tooltipRect.height / 2 - arrowRect.height / 2;
					arrowLeft = tooltipRect.width - 5;
				}
				break;
		}

		tooltipEl.style.top = `${top}px`;
		tooltipEl.style.left = `${left}px`;

		if (arrowEl && arrowRect) {
			arrowEl.style.top = `${arrowTop}px`;
			arrowEl.style.left = `${arrowLeft}px`;
		}
	}

	$effect(() => {
		triggerEl = document.getElementById(triggerBy);

		if (triggerEl) {
			triggerEl.addEventListener('mouseenter', show);
			triggerEl.addEventListener('mouseleave', onTriggerLeave);
		}

		function updTooltipPosition() {
			if (visible) setTooltipPosition();
		}

		window.addEventListener('resize', updTooltipPosition);
		window.addEventListener('scroll', updTooltipPosition, true);

		return () => {
			if (triggerEl) {
				triggerEl.removeEventListener('mouseenter', show);
				triggerEl.removeEventListener('mouseleave', onTriggerLeave);
			}

			window.removeEventListener('resize', updTooltipPosition);
			window.removeEventListener('scroll', updTooltipPosition, true);
		};
	});
</script>

{#if visible}
	<div
		role="tooltip"
		bind:this={tooltipEl}
		transition:fade={{ duration: 200, easing: linear }}
		class={tm(
			'fixed p-0.5 rounded-md bg-background transition-opacity',
			positioned ? 'visible opacity-100' : 'invisible opacity-0',
			className
		)}
		onmouseenter={onTooltipEnter}
		onmouseleave={onTooltipLeave}
		{...rest}
	>
		{@render children()}

		{#if arrow}
			<div
				bind:this={arrowEl}
				class="absolute z-50 pointer-events-none h-[10px] w-[10px] rotate-45 bg-background border-0 shadow-md"
			></div>
		{/if}
	</div>
{/if}
