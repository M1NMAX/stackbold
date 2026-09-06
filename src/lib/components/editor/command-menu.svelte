<script lang="ts">
	import { tm } from '$lib/utils/index.js';
	import { Button, Empty } from '$lib/components/base/index.js';
	import type { CommandItem } from './extensions/index.js';
	import { EDITOR_ICONS } from '$lib/constant/index.js';

	type Props = {
		items: CommandItem[];
		selectedIndex: number;
		onSelect: (item: CommandItem) => void;
		onMouseEnter: (index: number) => void;
		isItemActive?: (item: CommandItem) => boolean;
	};
	let { items, selectedIndex, onSelect, onMouseEnter, isItemActive }: Props = $props();
</script>

<div
	role="listbox"
	aria-label="Block commands"
	class="min-w-52 flex flex-col gap-y-2 p-1 border-2 border-secondary rounded-lg bg-popover shadow-lg"
>
	{#each items as item, i}
		{@const Icon = EDITOR_ICONS[item.icon]}
		{@const active = isItemActive?.(item) ?? false}
		<Button
			theme="ghost"
			variant="menu"
			class={tm(i === selectedIndex && 'bg-secondary/80')}
			role="option"
			aria-selected={i === selectedIndex}
			onmouseenter={() => onMouseEnter(i)}
			onmousedown={(e) => {
				e.preventDefault();
				onSelect(item);
			}}
		>
			{#if Icon}
				<Icon class={tm(active && 'text-primary')} />
			{/if}
			<span>{item.title}</span>
		</Button>
	{/each}
	{#if items.length === 0}
		<Empty text="No results" />
	{/if}
</div>
