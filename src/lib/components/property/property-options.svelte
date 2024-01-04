<script lang="ts">
	import type { Option as OptionType } from '@prisma/client';
	import { fade } from 'svelte/transition';
	import PropertyOption from './property-option.svelte';
	import { createEventDispatcher, tick } from 'svelte';
	import { Plus, X } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	export let propertyId: string;
	export let options: OptionType[];

	let show = false;

	const dispatch = createEventDispatcher<{ addOpt: { propertyId: string; value: string } }>();

	function handleKeypress(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		if (e.key !== 'Enter') return;
		const value = e.currentTarget.value;
		dispatch('addOpt', { propertyId, value });
		e.currentTarget.value = '';
	}

	function toggleShow() {
		show = !show;

		if (show) {
			tick().then(() => {
				document.getElementById('add-option')?.focus();
			});
		}
	}
</script>

<div class=" flex flex-col space-y-1.5 pt-1">
	<div class="flex justify-between space-x-1">
		<span class="text-sm font-semibold">Options</span>
		<Button variant="secondary" size="xs" on:click={toggleShow}>
			{#if show}
				<X class="icon-xs" />
			{:else}
				<Plus class="icon-xs" />
			{/if}
		</Button>
	</div>

	<input
		transition:fade
		on:keypress|stopPropagation={handleKeypress}
		id="add-option"
		placeholder="Enter option value"
		class={cn('input input-xs input-ghost bg-base-200 hidden', show && 'block')}
	/>

	<div class="space-y-1">
		{#each options as option}
			<PropertyOption {propertyId} {option} on:updOptColor on:updOptValue on:deleteOpt />
		{/each}
	</div>
</div>
