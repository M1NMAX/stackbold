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
		'grow flex items-center gap-x-1.5 px-2 text-base md:text-sm  font-medium select-none',
		'[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
		compact ? 'h-9 md:h-7' : 'py-0.5',
		hoverEffect && 'hover:bg-secondary hover:text-secondary-foreground cursor-pointer',
		className
	)}
>
	{#if name}
		{#if icon}
			{@const Icon = INPUT_ICONS[icon]}
			<Icon />
		{/if}
		<span class="font-semibold text-sm"> {name} </span>
	{:else if children}
		{@render children()}
	{/if}
</label>
