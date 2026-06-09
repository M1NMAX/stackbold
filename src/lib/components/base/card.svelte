<script lang="ts">
	import { PAGE_ICONS } from '$lib/constant';
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		icon?: string;
		title?: string;
		href?: string;
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
		class?: string;
	};

	let { icon, title, href, children, onclick, class: className }: Props = $props();
</script>

<a
	{href}
	{onclick}
	class={tm(
		'flex flex-col gap-y-2 p-3 border-2 rounded-md shadow-md bg-secondary/50 hover:bg-secondary/70',
		className
	)}
>
	{#if title}
		<div class="flex items-center gap-x-2">
			{#if icon}
				{@const Icon = PAGE_ICONS[icon]}
				<Icon class="size-5" />
			{/if}
			<h2 class="font-semibold text-sm">{title}</h2>
		</div>
	{/if}

	{@render children()}
</a>
