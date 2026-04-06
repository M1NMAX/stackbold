<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { slide } from 'svelte/transition';
	import { box, getAccordionState } from '$lib/states/index.js';
	import { tm, useId } from '$lib/utils/index.js';
	import { SLIDE_PARAMS } from '$lib/constant/index.js';

	type Props = {
		id?: string;
		title?: string;
		header?: Snippet;
		children: Snippet;
		triggerClass?: string;
		contentClass?: string;
		accordionHeader?: Snippet<[accordionItem: { isOpen: boolean; toggle: () => void }]>;
	};

	let {
		id = useId(),
		title,
		header,
		children,
		triggerClass,
		contentClass,
		accordionHeader
	}: Props = $props();

	const accordionState = getAccordionState();

	accordionState.addChild({ id: box(() => id) });

	const isOpen = $derived(accordionState.isOpen(id));

	function toggle() {
		if (accordionState.isOpen(id)) accordionState.close(id);
		else accordionState.open(id);
	}
</script>

<div
	class={tm(
		'first:rounded-t-md last:rounded-b-md border-secondary',
		isOpen
			? 'is-open my-3 border-2 first:mt-0 last:mb-0 rounded-md [&+*]:rounded-t-md'
			: 'has-[+.is-open]:rounded-b-md border-x-2 border-t-2 has-[+.is-open]:border-b-2 last:border-b-2'
	)}
>
	{#if accordionHeader}
		{@render accordionHeader({ isOpen, toggle })}
	{:else}
		<button
			onclick={toggle}
			aria-expanded={accordionState.isOpen(id)}
			class={tm(
				'h-full w-full flex items-center gap-x-1.5 py-1 px-1.5  font-medium transition-all hover:bg-secondary/70',
				isOpen && 'bg-secondary/10',
				triggerClass
			)}
		>
			{#if title}
				{title}
			{:else if header}
				{@render header()}
			{/if}

			<ChevronRight
				class={tm('size-4 transition-transform ', isOpen ? '-rotate-90' : 'rotate-0')}
			/>
		</button>
	{/if}
	{#if isOpen}
		<div
			transition:slide={{ ...SLIDE_PARAMS }}
			class={tm('p-2 overflow-hidden border-t-2 border-secondary', contentClass)}
		>
			{@render children()}
		</div>
	{/if}
</div>
