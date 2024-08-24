<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	type $$Props = SelectPrimitive.TriggerProps;
	type $$Events = SelectPrimitive.TriggerEvents;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<SelectPrimitive.Trigger
	class={cn(
		'flex flex-col items-start w-full rounded border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...$$restProps}
	let:builder
	on:click
	on:keydown
>
	<slot {builder} />
	<div class="w-full flex justify-between">
		<slot name="value" />
		{#if builder['aria-expanded']}
			<ChevronUp class="icon-sm opacity-50" />
		{:else}
			<ChevronDown class="icon-sm opacity-50" />
		{/if}
	</div>
</SelectPrimitive.Trigger>
