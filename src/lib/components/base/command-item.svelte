<script lang="ts">
	import { getCommandState } from '$lib/states';
	import { useId } from '$lib/utils/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		value: string;
		children: Snippet;
		onselect?: () => void;
	};

	let { value, children, onselect }: Props = $props();

	const id = useId();

	const commandState = getCommandState();
	commandState.registerItem(id, value, onselect);

	const item = $derived(commandState.getItemById(id));
</script>

{#if item.render}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		{id}
		role="option"
		aria-selected={item.isSelected}
		tabindex="-1"
		class={[
			'aria-selected:bg-secondary aria-selected:text-secondary-foreground',
			'w-full flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5',
			'text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			'[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0'
		]}
		onpointermove={() => commandState.setValue(id)}
		onclick={() => onselect?.()}
	>
		{@render children()}
	</div>
{/if}
