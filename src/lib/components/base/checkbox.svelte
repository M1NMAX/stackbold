<script lang="ts">
	import { tm } from '$lib/utils/index.js';
	import Check from '@lucide/svelte/icons/check';
	import Minus from '@lucide/svelte/icons/minus';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<HTMLInputAttributes, 'type' | 'children'> & {
		class?: string;
	};

	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...rest
	}: Props = $props();
</script>

<span class="relative inline-flex size-4 shrink-0 items-center justify-center">
	<input
		type="checkbox"
		bind:checked
		bind:indeterminate
		class="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
		{...rest}
	/>

	<span
		aria-hidden="true"
		class={tm(
			'pointer-events-none flex size-full items-center justify-center rounded-sm border-2 border-secondary bg-input/30 transition-colors',
			'peer-checked:border-primary peer-checked:bg-primary',
			'peer-indeterminate:border-primary peer-indeterminate:bg-primary',
			'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
			'peer-disabled:opacity-50',
			'peer-aria-invalid:border-destructive',
			'[&>svg]:size-3 [&>svg]:opacity-0 [&>svg]:transition-opacity',
			'peer-checked:[&>svg]:opacity-100 peer-indeterminate:[&>svg]:opacity-100',
			'peer-enabled:peer-hover:[&>svg]:opacity-60 peer-checked:peer-hover:[&>svg]:opacity-100',
			className
		)}
	>
		{#if indeterminate}
			<Minus strokeWidth={5} class="text-primary-foreground" />
		{:else}
			<Check strokeWidth={5} class="text-primary-foreground" />
		{/if}
	</span>
</span>
