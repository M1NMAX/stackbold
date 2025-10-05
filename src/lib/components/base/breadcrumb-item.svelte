<script lang="ts">
	import { goto } from '$app/navigation';
	import { PAGE_ICONS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		icon: string;
		name: string;
		last?: boolean;
		link?: string;
		class?: string;
	};

	let { icon, name, last = false, link, class: className }: Props = $props();

	const Icon = $derived(PAGE_ICONS[icon.toLowerCase()]);
	async function onclick() {
		if (!link) return;
		await goto(link);
	}
</script>

<button
	{onclick}
	class={tm(
		'flex items-center gap-x-2 py-1 px-1.5 rounded-md max-w-xs',
		link && 'hover:bg-secondary',
		last && 'cursor-default',
		className
	)}
>
	<Icon class="shrink-0 size-4" />
	<span class="font-semibold text-sm truncate"> {name} </span>
</button>
{#if !last}
	<div>/</div>
{/if}
