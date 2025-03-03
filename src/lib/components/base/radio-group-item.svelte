<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import { getRadioGroupState } from '$lib/states/index.js';
	import { tm } from '$lib/utils/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		id: string;
		value: string;
		disabled?: boolean;
		children?: Snippet;
		class?: string;
	};

	let { id, value, disabled = false, children, class: className }: Props = $props();
	const radioGroupState = getRadioGroupState();

	function handleClick() {
		if (radioGroupState.disabled || disabled) return;
		radioGroupState.setValue(value);
	}
</script>

<button
	{id}
	disabled={radioGroupState.disabled || disabled}
	type="button"
	role="radio"
	aria-checked={radioGroupState.isChecked(value)}
	tabindex={radioGroupState.getTabIndex(value)}
	class={tm(
		'[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-foreground',
		className
	)}
	onclick={handleClick}
	data-state={radioGroupState.isChecked(value) ? 'checked' : 'unchecked'}
>
	{@render children?.()}

	{#if radioGroupState.isChecked(value)}
		<Check />
	{/if}
</button>
