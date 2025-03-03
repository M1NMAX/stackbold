<script lang="ts">
	import { Accordion as AccordionPrimitive, type WithoutChild } from 'bits-ui';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { cn } from '$lib/utils/shadcn.js';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		extra,
		showArrow = true,
		...restProps
	}: WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps['level'];
		extra?: Snippet;
		showArrow?: boolean;
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="group flex items-center hover:bg-muted">
	<AccordionPrimitive.Trigger
		bind:ref
		class={cn(
			'flex flex-1 items-center justify-between py-4 font-medium transition-all',
			showArrow && '[&[data-state=open]>svg]:rotate-90',
			className
		)}
		{...restProps}
	>
		{#if showArrow}
			<ChevronRight class="size-4 mr-1 shrink-0 transition-transform duration-200" />
		{/if}
		{@render children?.()}
	</AccordionPrimitive.Trigger>
	{@render extra?.()}
</AccordionPrimitive.Header>
