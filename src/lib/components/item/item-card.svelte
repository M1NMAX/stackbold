<script module>
	let editing = $state('');
</script>

<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import PencilLine from 'lucide-svelte/icons/pencil-line';
	import { ItemMenu, getItemState } from './index.js';
	import { PropertyValue, getPropertyState } from '$lib/components/property/index.js';
	import { ViewType, type Item, type View } from '@prisma/client';
	import type { RouterInputs } from '$lib/trpc/router';
	import { DEBOUNCE_INTERVAL, MAX_ITEM_NAME_LENGTH } from '$lib/constant/index.js';
	import debounce from 'debounce';
	import { Button } from '$lib/components/base/index.js';
	import { escapeKeydown, enterKeydown, clickOutside } from '$lib/actions/index.js';
	import { getPropertyRef, isPropertyVisible, tm, useId } from '$lib/utils/index.js';
	import type { ClickItemEvent } from '$lib/types.js';

	type Props = {
		view: View;
		item: Item;
		clickOpenItem: (id: string) => void;
	};

	let { view, item, clickOpenItem }: Props = $props();
	const draggable = $derived.by(() => view.type === ViewType.BOARD && view.groupBy != null);
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const itemInputId = useId('item-input-id');

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);
	async function updItem(args: RouterInputs['items']['update']) {
		await itemState.updItem(args);
	}

	function handleOnInput(e: Event) {
		e.stopPropagation();
		const targetEl = e.target as HTMLInputElement;

		const id = targetEl.dataset.id!;
		const name = targetEl.value;
		if (item.name === name) return;
		updItemDebounced({ id, name });
	}

	function onclick(e: ClickItemEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('[data-properties-values], button')) return;
		clickOpenItem(item.id);
	}

	async function saveAndClose(target: HTMLInputElement) {
		const id = target.dataset.id!;
		const name = target.value;
		if (item.name !== name) {
			await updItem({ id, name });
		}
		stopEditing();
	}

	function ondragstart(e: DragEvent) {
		e.stopPropagation();
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.dropEffect = 'move';
		e.dataTransfer.setData('text/plain', item.id);
	}

	function isEditing(id: string) {
		return editing === id;
	}

	function startEditing(id: string) {
		editing = id;
	}

	function stopEditing() {
		editing = '';
	}

	$effect(() => {
		if (!editing) return;
		document.getElementById(editing)?.focus();
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	{draggable}
	tabindex="0"
	role="button"
	use:escapeKeydown
	use:enterKeydown
	onescapekey={(e) => saveAndClose(e.target as HTMLInputElement)}
	onenterkey={(e) => saveAndClose(e.target as HTMLInputElement)}
	{onclick}
	{ondragstart}
	class={tm(
		'w-full flex flex-col items-start p-1.5 gap-y-1 rounded-md select-none bg-secondary/50 hover:bg-secondary/60 group',
		item.id === itemState.active && 'border border-primary bg-secondary/80'
	)}
>
	{#if isEditing(itemInputId)}
		<div class="relative w-full">
			<input
				use:clickOutside
				id={itemInputId}
				data-id={item.id}
				value={item.name}
				maxlength={MAX_ITEM_NAME_LENGTH}
				oninput={handleOnInput}
				onclickoutside={(e) => saveAndClose(e.target as HTMLInputElement)}
				onclick={(e) => e.stopPropagation()}
				class="w-full h-7 p-1 pr-7 text-md font-semibold focus:outline-none focus-within:ring-2 focus-within:ring-primary rounded-md bg-secondary/30"
			/>

			<Button type="button" variant="cicon" class="absolute right-0.5 top-0.5">
				<Check />
			</Button>
		</div>
	{:else}
		<div class="w-full flex justify-between items-center gap-x-1.5">
			<p class="text-md font-semibold grow truncate">
				{item.name}
			</p>
			<div
				class="flex items-center gap-x-1.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
			>
				<Button theme="ghost" variant="cicon" onclick={() => startEditing(itemInputId)}>
					<PencilLine />
				</Button>
				<ItemMenu id={item.id} name={item.name} {clickOpenItem} align="end" />
			</div>
		</div>
	{/if}

	<div class="flex items-end flex-wrap gap-2" data-properties-values>
		{#each propertyState.properties as property (property.id)}
			{#if isPropertyVisible(view, property.id)}
				{@const propertyRef = getPropertyRef(item.properties, property.id)}
				{#if propertyRef}
					<PropertyValue {item} {property} {view} />
				{/if}
			{/if}
		{/each}
	</div>
</div>
