<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';

	export let id: string = '';
	export let tootipText: string | null = null;

	let className: string = '';
	export { className as class };
</script>

<button {id} on:click class={` btn btn-sm rounded px-2 py-1 ${className}`}>
	<slot />
</button>

{#if tootipText}
	<Tooltip class="tooltip">{tootipText}</Tooltip>
{/if}
