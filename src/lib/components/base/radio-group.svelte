<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tm, useId } from '$lib/utils/index.js';
	import { setRadioGroupState } from '$lib/states/index.js';
	import type { OnChangeFn } from '$lib/types';

	type Props = {
		id?: string;
		name?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		onchange?: OnChangeFn<string>;
		children: Snippet;
		class?: string;
	};

	let {
		id = useId(),
		name = undefined,
		required = false,
		disabled = false,
		value,
		onchange,
		children,
		class: className
	}: Props = $props();

	setRadioGroupState(value ?? '', disabled, onchange);
</script>

<div {id} role="radiogroup" aria-disabled={required} class={tm('gap-y-0', className)}>
	{@render children()}
</div>

{#if name}
	<input {name} {value} {required} {disabled} aria-hidden="true" hidden tabindex="-1" />
{/if}
