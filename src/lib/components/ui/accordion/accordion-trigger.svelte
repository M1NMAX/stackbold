<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { ChevronRight } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	type $$Props = AccordionPrimitive.TriggerProps & {
		showArrow?: boolean;
	};
	type $$Events = AccordionPrimitive.TriggerEvents;

	let className: $$Props['class'] = undefined;
	export let level: AccordionPrimitive.HeaderProps['level'] = 3;
	export { className as class };
	export let showArrow: $$Props['showArrow'] = true;
</script>

<AccordionPrimitive.Header
	{level}
	class={cn('group flex items-center hover:bg-muted', !showArrow && 'rounded-sm')}
>
	<AccordionPrimitive.Trigger
		class={cn(
			'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline',
			showArrow && '[&[data-state=open]>svg]:rotate-90',
			className
		)}
		{...$$restProps}
		on:click
	>
		{#if showArrow}
			<ChevronRight class="h-4 w-4 mr-1 transition-transform duration-200" />
		{/if}
		<slot />
	</AccordionPrimitive.Trigger>
	<slot name="extra" />
</AccordionPrimitive.Header>
