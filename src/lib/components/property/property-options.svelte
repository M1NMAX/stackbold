<script lang="ts">
	import type { Option as OptionType } from '@prisma/client';
	import { fade } from 'svelte/transition';
	import PropertyOption from './property-option.svelte';
	import { createEventDispatcher } from 'svelte';
	import { Plus, X } from 'lucide-svelte';
	import { Button } from '../ui/button';

	export let propertyId: string;
	export let options: OptionType[];

	const dispatch = createEventDispatcher<{ addOpt: { propertyId: string; value: string } }>();

	let showInput = false;
</script>

<div class=" flex flex-col space-y-1.5 pt-1">
	<div class="flex justify-between space-x-1">
		<span class="text-sm font-semibold">Options</span>
		<Button variant="outline" size="xs" on:click={() => (showInput = !showInput)}>
			{#if showInput}
				<X class="icon-xs" />
			{:else}
				<Plus class="icon-xs" />
			{/if}
		</Button>
	</div>

	<input
		transition:fade
		class={`  input input-xs input-ghost bg-base-200  ${showInput ? 'block' : 'hidden'}`}
		placeholder="Enter option value"
		on:keypress|stopPropagation={(e) => {
			if (e.key === 'Enter') dispatch('addOpt', { propertyId, value: e.currentTarget.value });
		}}
	/>

	<div class="space-y-1">
		{#each options as option}
			<PropertyOption {propertyId} {option} on:updOptColor on:updOptValue on:deleteOpt />
		{/each}
	</div>
</div>
