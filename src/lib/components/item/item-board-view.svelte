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
		scrollTop: number;
	};

	let { key, view, items, clickOpenItem, header, scrollTop }: Props = $props();

	let multiplier = $state(1);
	let dragover = $state(false);

	const renderLimit = $derived(ITEMS_CHUNK_SIZE * multiplier);
	const itemState = getItemState();

	function ondragover(e: DragEvent) {
		e.preventDefault();
		dragover = true;
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
	class={tm('h-full min-w-96 grow flex flex-col rounded-md', dragover && 'bg-secondary/30')}
	{ondrop}
	{ondragover}
	{ondragleave}
>
	<div
		class={tm(
			'z-10 w-full p-2 rounded-md bg-secondary/20',
			scrollTop > 120 && 'bg-secondary',
			items.length > 0 && 'rounded-b-none'
		)}
		style="transform: translateY({Math.max(0, scrollTop - 126)}px)"
	>
		{@render header()}
		{#if scrollTop > 120}
			<div
				class="absolute -top-[200px] left-0 -z-10 w-full h-[200px] bg-secondary rounded-md"
			></div>
		{/if}
	</div>

	{#if items.length > 0}
		<div
			class={tm(
				'relative z-0 h-fit w-full flex flex-col items-start gap-2 px-2 pb-2 rounded-md rounded-t-none bg-secondary/20',
				scrollTop > 120 && 'pt-4'
			)}
		>
			{#each items.slice(0, renderLimit) as item (item.id)}
				<ItemCard {item} {view} {clickOpenItem} />
			{/each}
			{#if items.length > renderLimit}
				<Button
					theme="ghost"
					variant="menu"
					class="justify-center"
					onclick={() => (multiplier += 1)}
				>
					<ArrowDown />
					Load more
				</Button>
			{/if}
		</div>
	{/if}
</div>
