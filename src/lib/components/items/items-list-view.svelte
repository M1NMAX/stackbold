<script module>
	let currentlyEditing = $state('');
</script>

<script lang="ts">
	import { ItemMenu, getActiveItemState, getItemState } from '.';
	import {
		PropertyValue,
		containsView,
		// helpers
		getPropertyRef,
		getPropertyState
	} from '$lib/components/property';
	import { type Item, View } from '@prisma/client';
	import { cn } from '$lib/utils';
	import type { RouterInputs } from '$lib/trpc/router';
	import { DEBOUNCE_INTERVAL, MAX_ITEM_NAME_LENGTH } from '$lib/constant';
	import debounce from 'debounce';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Check, Pencil } from 'lucide-svelte';

	type Props = {
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { items, clickOpenItem }: Props = $props();

	const activeItem = getActiveItemState();
	const propertyState = getPropertyState();
	const itemState = getItemState();

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);
	async function updItem(args: RouterInputs['items']['update']) {
		itemState.updItem(args);
	}

	//TODO: validate text
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;

		const id = targetEl.dataset.id!;
		const name = targetEl.value;
		updItemDebounced({ id, data: { name } });
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
		updItem({ id, data: { name } });
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

<div class="h-full space-y-2 grow overflow-y-auto">
	{#each items as item}
		<div
			tabindex="0"
			role="button"
			onclick={(e) => onClickItemBody(e, item.id)}
			onkeydown={(e) => handleItemKeydownEvent(e, item.id)}
			class={cn(
				'relative flex flex-col items-start py-1 px-2 space-y-2 overflow-hidden rounded-sm  bg-secondary/40 hover:bg-secondary/50 group ',
				item.id === activeItem.id && 'rounded-r-none border-r-2 border-primary bg-secondary/80'
			)}
		>
			{#if isCurrentlyEditing(item.id)}
				<input
					id={item.id}
					data-id={item.id}
					value={item.name}
					oninput={handleOnInput}
					onfocusout={handleFocusOut}
					maxlength={MAX_ITEM_NAME_LENGTH}
					class="w-full p-1 pr-4 text-lg font-semibold focus:outline-none rounded-md"
				/>

				<Button
					size="xs"
					variant="ghost"
					on:click={() => {
						const target = document.getElementById(item.id) as HTMLInputElement;
						saveAndClose(target);
					}}
					class="absolute right-3 top-0"
				>
					<Check class="icon-xs" />
				</Button>
			{:else}
				<p class="text-lg font-semibold">
					{item.name}
				</p>
				<div
					class="absolute right-2 top-0 flex items-center gap-x-0.5 invisible md:group-hover:visible"
				>
					<Button size="xs" variant="ghost" on:click={() => startEditing(item.id)}>
						<Pencil class="icon-xs" />
					</Button>
					<ItemMenu id={item.id} name={item.name} {clickOpenItem} />
				</div>
			{/if}

			<div class="flex flex-wrap gap-2">
				{#each propertyState.properties as property (property.id)}
					{#if containsView(property.visibleInViews, View.LIST)}
						{@const propertyRef = getPropertyRef(item.properties, property.id)}
						{#if propertyRef}
							<PropertyValue itemId={item.id} {property} />
						{/if}
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
