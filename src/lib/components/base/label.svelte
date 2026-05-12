<script lang="ts">
	import { INPUT_ICONS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		for: string;
		name?: string;
		icon?: string;
		children?: Snippet;
		hoverEffect?: boolean;
		compact?: boolean;
		class?: string;
	};

	let {
		for: forProp,
		name,
		icon,
		children,
		hoverEffect = false,
		compact = false,
		class: className
	}: Props = $props();
</script>

<label
	for={forProp}
	class={tm(
		'grow flex items-center gap-2 lg:gap-x-1.5 px-2 text-base lg:text-sm text-secondary-foreground font-medium select-none',
		'[&_svg]:pointer-events-none [&_svg]:size-5 lg:[&_svg]:size-4 [&_svg]:shrink-0',
		compact ? 'h-9 lg:h-7 [&>span]:grow' : 'py-0.5',
		hoverEffect &&
			'transition-colors rounded-none lg:rounded-sm hover:bg-secondary hover:text-secondary-foreground cursor-pointer',
		className
	)}
>
	{#if name}
		{#if icon}
			{@const Icon = INPUT_ICONS[icon]}
			<Icon />
		{/if}
		<span> {name} </span>
	{:else if children}
		{@render children()}
	{/if}
</label>
