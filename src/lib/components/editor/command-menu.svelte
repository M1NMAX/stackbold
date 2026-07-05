<script lang="ts">
	import { tm } from '$lib/utils/index.js';
	import { Button } from '$lib/components/base/index.js';
	import type { CommandItem } from './extensions/index.js';
	import { EDITOR_ICONS } from '$lib/constant/index.js';

	type Props = {
		items: CommandItem[];
		selectedIndex: number;
		onSelect: (item: CommandItem) => void;
	};

	let { items, selectedIndex, onSelect }: Props = $props();
</script>

<div
	role="listbox"
	aria-label="Block commands"
	class="min-w-52 flex flex-col gap-y-2 p-1 border-2 border-secondary rounded-lg bg-popover shadow-lg"
>
	{#each items as item, i}
		{@const Icon = EDITOR_ICONS[item.icon]}

		<Button
			theme="ghost"
			variant="menu"
			class={tm(i === selectedIndex && 'bg-secondary/80')}
			role="option"
			aria-selected={i === selectedIndex}
			onmousedown={(e) => {
				e.preventDefault();
				onSelect(item);
			}}
		>
			{#if Icon}
				<Icon />
			{/if}

			<span>{item.title}</span>
		</Button>
	{/each}

	{#if items.length === 0}
		<div class="p-1 text-base font-medium text-secondary-foreground">No results</div>
	{/if}
</div>
