<script lang="ts">
	import type { Option as OptionType } from '@prisma/client';
	import { fade } from 'svelte/transition';
	import PropertyOption from './property-option.svelte';
	import { tick } from 'svelte';
	import { Plus, X } from 'lucide-svelte';
	import { Button } from '$lib/components/base/index.js';
	import { tm } from '$lib/utils';
	import { getPropertyState } from '.';

	type Props = {
		propertyId: string;
		options: OptionType[];
	};

	let { propertyId, options }: Props = $props();

	let show = $state(false);

	const propertyState = getPropertyState();

	function handleKeypress(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		e.stopPropagation();
		if (e.key !== 'Enter') return;
		const value = e.currentTarget.value;
		propertyState.addOptionToProperty(propertyId, value);
		e.currentTarget.value = '';
	}

	$effect.pre(() => {
		if (show) {
			tick().then(() => {
				document.getElementById('add-option')?.focus();
			});
		}
	});
</script>

<div class=" flex flex-col space-y-1.5 pt-1">
	<div class="flex justify-between space-x-1">
		<span class="text-sm font-semibold">Options</span>
		<Button theme="secondary" variant="compact" onclick={() => (show = !show)}>
			{#if show}
				<X />
			{:else}
				<Plus />
			{/if}
		</Button>
	</div>

	<input
		transition:fade
		onkeypress={handleKeypress}
		id="add-option"
		placeholder="Enter option value"
		class={tm(
			'h-8 w-full p-1 rounded-sm border border-input bg-secondary text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 hidden',
			show && 'block'
		)}
	/>

	<div class="space-y-1">
		{#each options as option}
			<PropertyOption {propertyId} {option} />
		{/each}
	</div>
</div>
