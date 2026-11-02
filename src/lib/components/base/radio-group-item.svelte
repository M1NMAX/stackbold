<script lang="ts">
	import Circle from '@lucide/svelte/icons/circle';
	import { getRadioGroupState } from '$lib/states/index.js';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		id: string;
		value: string;
		disabled?: boolean;
		class?: string;
	};

	let { id, value, disabled = false, class: className }: Props = $props();
	const radioGroupState = getRadioGroupState();

	function handleClick() {
		if (radioGroupState.isDisabled() || disabled) return;
		radioGroupState.setValue(value);
	}
</script>

<button
	{id}
	disabled={radioGroupState.isDisabled() || disabled}
	type="button"
	role="radio"
	aria-checked={radioGroupState.isChecked(value)}
	tabindex={radioGroupState.getTabIndex(value)}
	class={tm(
		'flex justify-center items-center size-4 aspect-square shrink-0 border-2 outline-none border-secondary rounded-full dark:bg-input/30',
		'aria-invalid:aria-checked:border-primary aria-invalid:border-destructive focus-visible:border-ring focus-visible:ring-ring/50 ',
		'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/50  focus-visible:ring-3 aria-invalid:ring-3',
		'disabled:cursor-not-allowed disabled:opacity-50',
		'[&>svg]:pointer-events-none [&>svg]:size-2 [&_svg]:shrink-0 text-foreground',
		radioGroupState.isChecked(value) ? 'border-primary' : 'border-secondary',
		className
	)}
	onclick={handleClick}
	data-state={radioGroupState.isChecked(value) ? 'checked' : 'unchecked'}
>
	{#if radioGroupState.isChecked(value)}
		<Circle class="fill-primary text-primary" />
	{/if}
</button>
