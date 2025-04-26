<script lang="ts">
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		id: string;
		checked: boolean;
		name?: string;
		required?: boolean;
		disabled?: boolean;
		value?: string;
		children?: Snippet;
		onchange?: (value: boolean) => void;
	};

	let { id, checked, value = 'on', name, required, disabled, children, onchange }: Props = $props();

	function toggle() {
		checked = !checked;
		onchange?.(checked);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!(e.key === 'Enter' || e.key === 'Space') || disabled) return;
		e.preventDefault();
		toggle();
	}

	function handleClick() {
		if (disabled) return;
		toggle();
	}
</script>

<button
	{id}
	type="button"
	role="switch"
	aria-checked={checked}
	aria-required={required}
	{disabled}
	onclick={handleClick}
	onkeydown={handleKeydown}
	class={tm(
		'peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors',
		'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
		'disabled:cursor-not-allowed disabled:opacity-50',
		checked ? 'bg-primary' : 'bg-input'
	)}
>
	<span
		class={tm(
			'bg-background pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform',
			checked ? 'translate-x-4' : 'translate-x-0'
		)}
	>
		{@render children?.()}
	</span>
</button>

{#if name}
	<input type="checkbox" {name} {value} {checked} {required} {disabled} aria-hidden="true" hidden />
{/if}
