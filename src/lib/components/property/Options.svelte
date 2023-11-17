<script lang="ts">
	import type { Option as OptionType } from '@prisma/client';

	import { fade } from 'svelte/transition';
	import Option from './Option.svelte';
	import { createEventDispatcher } from 'svelte';
	import { Plus, X } from 'lucide-svelte';

	export let propertyId: string;
	export let options: OptionType[];

	const dispatch = createEventDispatcher<{ addOpt: { propertyId: string; value: string } }>();

	let showInput = false;
</script>

<div class=" flex flex-col space-y-1.5 border-t pt-1">
	<div class="flex justify-between space-x-1">
		<span class="text-sm font-semibold">Options</span>
		<button on:click={() => (showInput = !showInput)} class="btn btn-xs p-1 rounded-xs">
			{#if showInput}
				<X class="w-4 h-4" />
			{:else}
				<Plus class="w-4 h-4" />
			{/if}
		</button>
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
			<Option {propertyId} {option} on:updOptColor on:updOptValue on:deleteOpt />
		{/each}
	</div>
</div>
