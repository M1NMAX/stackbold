<script lang="ts">
	import type { Color, Colors, Size, Sizes } from '$lib/types';
	import { Button, Tooltip } from 'flowbite-svelte';

	export let id: string = '';
	export let tootipText: string | null = null;
	export let color: Color = 'gray';
	export let size: Size = 'xs';

	let className: string = '';
	export { className as class };

	const sizes: Sizes = {
		xxs: 'w-3 h-3 p-3.5 m-0',
		xs: 'w-6 h-6 p-4'
	};
	const colors: Colors = {
		gray: 'bg-gray-200 hover:bg-gray-300 ',
		dark: 'bg-gray-100 hover:bg-gray-50'
	};
</script>

<button {id} on:click class={` btn btn-sm rounded px-2 py-1 ${className}`}>
	<slot />
</button>

{#if tootipText}
	<Tooltip>{tootipText}</Tooltip>
{/if}
