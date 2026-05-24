<script lang="ts">
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import { Button } from '$lib/components/base/index.js';
	import { tm, useId } from '$lib/utils/index.js';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		variant?: 'secondary' | 'ghost';
	} & HTMLInputAttributes;

	let {
		id = useId(),
		value = $bindable(),
		placeholder = 'Search',
		variant = 'secondary',
		...rest
	}: Props = $props();
</script>

<div class="relative w-full">
	<div class="input-left-icon">
		<Search />
	</div>
	<input
		{id}
		{placeholder}
		bind:value
		class={tm('input icon-left icon-right !h-9 lg:!h-9', variant)}
		{...rest}
	/>

	{#if value && value.length > 0}
		<Button
			type="button"
			theme="ghost"
			variant="cicon"
			class="absolute top-0.5 lg:top-1.5 right-0.5 lg:right-1.5"
			onclick={() => (value = '')}
		>
			<X />
		</Button>
	{/if}
</div>
