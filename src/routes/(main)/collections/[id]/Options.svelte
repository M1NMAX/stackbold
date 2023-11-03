<script lang="ts">
	import { CloseOutline, PlusOutline } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';

	export let handleAddOption: (value: string) => void;

	let showInput = false;
</script>

<div class=" flex flex-col space-y-1.5 border-t pt-1">
	<div class="flex justify-between space-x-1">
		<span class="text-sm font-semibold">Options</span>
		<button on:click={() => (showInput = !showInput)} class="btn btn-xs p-1 rounded-xs">
			{#if showInput}
				<CloseOutline size="xs" />
			{:else}
				<PlusOutline size="xs" />
			{/if}
		</button>
	</div>

	<input
		transition:fade
		class={`  input input-xs input-ghost bg-base-200  ${showInput ? 'block' : 'hidden'}`}
		placeholder="Enter option value"
		on:keypress|stopPropagation={(e) => {
			if (e.key === 'Enter') {
				const value = e.currentTarget.value;
				handleAddOption(value);
			}
		}}
	/>

	<div class="space-y-1">
		<slot />
	</div>
</div>
