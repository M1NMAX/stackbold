<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { slide } from 'svelte/transition';
	import { getAccordionState } from '$lib/states/index.js';
	import { tm, useId } from '$lib/utils/index.js';

	type Props = {
		id?: string;
		title?: string;
		header?: Snippet;
		children: Snippet;
		extra?: Snippet;
		arrow?: boolean;
		contentClass?: string;
	};

	let {
		id = useId(),
		title,
		header,
		children,
		arrow = true,
		extra,
		contentClass
	}: Props = $props();

	const accordionState = getAccordionState();

	accordionState.addChild(id);

	const isOpen = $derived(accordionState.isOpen(id));

	function handleClick() {
		if (accordionState.isOpen(id)) accordionState.close(id);
		else accordionState.open(id);
	}
</script>

<div>
	<div class="flex items-center gap-x-2 rounded-sm hover:bg-secondary group">
		<button
			onclick={handleClick}
			aria-expanded={accordionState.isOpen(id)}
			class="grow h-9 md:h-7 flex items-center gap-x-1.5 py-0.5 px-1 font-medium transition-all"
		>
			{#if arrow}
				<ChevronRight
					class={tm('size-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-90')}
				/>
			{/if}

			{#if title}
				{title}
			{:else if header}
				{@render header()}
			{/if}
		</button>

		{@render extra?.()}
	</div>
	{#if isOpen}
		<div
			transition:slide={{ delay: 10, duration: 150 }}
			class={tm('p-1 overflow-hidden', contentClass)}
		>
			{@render children()}
		</div>
	{/if}
</div>
