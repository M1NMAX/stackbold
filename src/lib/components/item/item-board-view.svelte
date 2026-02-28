<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import type { Snippet } from 'svelte';
	import { type Item, type View } from '@prisma/client';
	import { getItemState, ItemCard } from './index.js';
	import { tm } from '$lib/utils/index.js';
	import { Button } from '$lib/components/base/index.js';
	import { ITEMS_CHUNK_SIZE } from '$lib/constant/index.js';

	type Props = {
		key: string;
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
		header: Snippet;
	};

	let { key, view, items, clickOpenItem, header }: Props = $props();

	let multiplier = $state(1);
	let dragover = $state(false);

	const renderLimit = $derived(ITEMS_CHUNK_SIZE * multiplier);
	const itemState = getItemState();

	function ondragover(e: DragEvent) {
		e.preventDefault();
		dragover = true;
		const target = e.target as HTMLDivElement;
		target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
	}

	function ondragleave(e: DragEvent) {
		e.preventDefault();
		dragover = false;
	}

	async function ondrop(e: DragEvent) {
		dragover = false;
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = 'move';
		const id = e.dataTransfer.getData('text/plain');
		if (!id || !view.groupBy) return;
		await itemState.updPropertyRef(id, { id: view.groupBy, value: key });
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={tm(
		'min-w-96 grow h-fit flex flex-col items-start gap-2 p-2 rounded-md bg-secondary/30',
		dragover && 'bg-secondary/60'
	)}
	{ondrop}
	{ondragover}
	{ondragleave}
>
	{@render header()}
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
