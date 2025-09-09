<script module>
	let currentlyEditing = $state('');
</script>

<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import Check from 'lucide-svelte/icons/check';
	import Pencil from 'lucide-svelte/icons/pencil';
	import { ItemMenu, getItemState } from './index.js';
	import {
		PropertyValue,
		getPropertyRef,
		getPropertyState,
		isPropertyVisible
	} from '$lib/components/property';
	import { type Item, type View } from '@prisma/client';
	import type { RouterInputs } from '$lib/trpc/router';
	import {
		DEBOUNCE_INTERVAL,
		ITEMS_CHUNK_SIZE,
		MAX_ITEM_NAME_LENGTH
	} from '$lib/constant/index.js';
	import debounce from 'debounce';
	import { Button } from '$lib/components/base/index.js';

	type Props = {
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { view, items, clickOpenItem }: Props = $props();

	let multiplier = $state(1);
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const renderLimit = $derived(ITEMS_CHUNK_SIZE * multiplier);

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);
	async function updItem(args: RouterInputs['items']['update']) {
		itemState.updItem(args);
	}

	//TODO: validate text
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;

		const id = targetEl.dataset.id!;
		const name = targetEl.value;
		updItemDebounced({ id, name });
	}

	type ClickItemEvent = MouseEvent & {
		currentTarget: EventTarget & HTMLDivElement;
	};
	function onClickItemBody(e: ClickItemEvent, itemId: string) {
		if (e.target === e.currentTarget || e.target === e.currentTarget.firstChild) {
			clickOpenItem(itemId);
		}
	}

	type ItemKeydownEvent = KeyboardEvent & {
		currentTarget: EventTarget & HTMLDivElement;
	};

	function handleItemKeydownEvent(e: ItemKeydownEvent, id: string) {
		if (e.key !== 'Enter' && e.key !== 'Escape') return;

		if (e.key === 'Escape') {
			saveAndClose(e.target as HTMLInputElement);
			return;
		}

		if (e.key === 'Enter') {
			if (!isCurrentlyEditing(id)) {
				clickOpenItem(id);
				return;
			}
			saveAndClose(e.target as HTMLInputElement);
			return;
		}
	}

	function handleFocusOut(e: FocusEvent) {
		saveAndClose(e.target as HTMLInputElement);
	}

	//TODO: Value validation
	function saveAndClose(target: HTMLInputElement) {
		const id = target.dataset.id!;
		const name = target.value;
		updItem({ id, name });
		stopEditing();
	}

	function isCurrentlyEditing(id: string) {
		return currentlyEditing === id;
	}

	function startEditing(id: string) {
		currentlyEditing = id;
	}

	function stopEditing() {
		currentlyEditing = '';
	}

	$effect(() => {
		if (currentlyEditing) {
			document.getElementById(currentlyEditing)?.focus();
		}
	});
</script>

<div class="h-full space-y-2 grow">
	{#each items.slice(0, renderLimit) as item (item.id)}
		<div
			tabindex="0"
			role="button"
			onclick={(e) => onClickItemBody(e, item.id)}
			onkeydown={(e) => handleItemKeydownEvent(e, item.id)}
			class={[
				'relative flex flex-col items-start p-1.5 gap-y-2 rounded-sm bg-secondary bg-opacity-80 dark:bg-opacity-40 hover:bg-secondary/40 dark:hover:bg-secondary/60 group',
				item.id === itemState.active && 'rounded-r-none border-r-2 border-primary bg-secondary/80'
			]}
		>
			{#if isCurrentlyEditing(item.id)}
				<input
					id={item.id}
					data-id={item.id}
					value={item.name}
					oninput={handleOnInput}
					onfocusout={handleFocusOut}
					maxlength={MAX_ITEM_NAME_LENGTH}
					class="w-full p-1 pr-7 text-lg font-semibold focus:outline-none rounded-sm"
				/>

				<Button
					theme="ghost"
					variant="compact"
					onclick={() => {
						const target = document.getElementById(item.id) as HTMLInputElement;
						saveAndClose(target);
					}}
					class="absolute right-3 top-0"
				>
					<Check />
				</Button>
			{:else}
				<p class="text-lg font-semibold">
					{item.name}
				</p>
				<div class="absolute right-2 top-0 flex items-center gap-x-0.5 invisible md:visible">
					<Button theme="ghost" variant="compact" onclick={() => startEditing(item.id)}>
						<Pencil />
					</Button>
					<ItemMenu id={item.id} name={item.name} {clickOpenItem} align="end" />
				</div>
			{/if}

			<div class="flex flex-wrap gap-2">
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
	{/each}

	{#if items.length > renderLimit}
		<Button theme="ghost" variant="menu" class="justify-center" onclick={() => (multiplier += 1)}>
			<ArrowDown />
			Load more
		</Button>
	{/if}
</div>
