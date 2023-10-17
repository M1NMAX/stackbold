<script lang="ts">
	import type { Colors, Size, Sizes } from '$lib/types';
	import { Button, Tooltip } from 'flowbite-svelte';

	export let id: string = '';
	export let tootipText: string | null = null;
	export let color: string = 'gray';
	export let size: Size = 'xs';
	export let extraClass = '';

	const sizes: Sizes = {
		xxs: 'w-4 h-4',
		xs: 'w-6 h-6'
	};
	const colors: Colors = {
		gray: 'bg-gray-200 hover:bg-gray-300 ',
		alternative: 'bg-gray-100 hover:bg-gray-50'
	};
</script>

<Button
	{id}
	on:click
	class={`${colors[color]} ${sizes[size]} text-black  p-4 rounded focus:ring-0 border-0 ${extraClass}`}
>
	<slot />
</Button>

{#if tootipText}
	<Tooltip>{tootipText}</Tooltip>
{/if}
