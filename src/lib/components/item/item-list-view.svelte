<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import { ItemCard } from './index.js';
	import { type Item, type View } from '@prisma/client';
	import { ITEMS_CHUNK_SIZE } from '$lib/constant/index.js';
	import { Button } from '$lib/components/base/index.js';

	type Props = {
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { view, items, clickOpenItem }: Props = $props();
	let multiplier = $state(1);
	const renderLimit = $derived(ITEMS_CHUNK_SIZE * multiplier);
</script>

<div class="h-full space-y-2 grow">
	{#each items.slice(0, renderLimit) as item (item.id)}
		<ItemCard {item} {view} {clickOpenItem} />
	{/each}

	{#if items.length > renderLimit}
		<Button theme="ghost" variant="menu" class="justify-center" onclick={() => (multiplier += 1)}>
			<ArrowDown />
			Load more
		</Button>
	{/if}
</div>
