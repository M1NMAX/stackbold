<script lang="ts">
	import { ItemMenu, getActiveItemState } from '.';
	import {
		PropertyValue,
		containsView,
		// helpers
		getPropertyColor,
		getPropertyRef,
		getPropertyValue
	} from '$lib/components/property';
	import { type Property, type Item, View } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils';
	import { getScreenState } from '$lib/components/view';

	type Props = {
		items: Item[];
		properties: Property[];
		clickOpenItem: (id: string) => void;
		renameItem: (id: string, name: string) => void;

		//forward
		updPropertyValue: (itemId: string, property: { id: string; value: string }) => void;

		clickDuplicateItem: (id: string) => void;
		clickDeleteItem: (id: string) => void;
	};

	let { items, properties, clickOpenItem, renameItem, updPropertyValue, ...rest }: Props = $props();

	const activeItem = getActiveItemState();
	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		renameItem: { id: string; name: string };
	}>();

	//TODO: validate inner text
	function handleOnInput(e: { currentTarget: EventTarget & HTMLDivElement }) {
		const targetEl = e.currentTarget;

		const id = targetEl.dataset.id!;
		const name = targetEl.innerText;
		renameItem(id, name);
	}

	function preventEnterKeypress(e: KeyboardEvent) {
		if (e.key === 'Enter') e.preventDefault();
	}

	function onClickItemBody(
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLDivElement;
		},
		itemId: string
	) {
		if (e.target === e.currentTarget) {
			clickOpenItem(itemId);
		}
	}
</script>

<div class="h-full space-y-2 grow overflow-y-auto">
	{#each items as item}
		<div
			tabindex="0"
			role="button"
			onclick={(e) => onClickItemBody(e, item.id)}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					clickOpenItem(item.id);
				}
			}}
			class={cn(
				'relative flex flex-col items-start py-1 px-2 space-y-2 overflow-hidden rounded-sm  bg-secondary/40 hover:bg-secondary/50 group ',
				item.id === $activeItem?.id && 'rounded-r-none border-r-2 border-primary bg-secondary/80'
			)}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				contenteditable
				spellcheck={false}
				onkeypress={preventEnterKeypress}
				oninput={handleOnInput}
				data-id={item.id}
				class="text-lg font-semibold focus:outline-none"
			>
				{item.name}
			</div>

			<ItemMenu
				itemId={item.id}
				{clickOpenItem}
				{...rest}
				class={cn('absolute right-2 top-0', $isDesktop && 'invisible group-hover:visible')}
			/>

			<div class="flex flex-wrap gap-2">
				{#each properties as property (property.id)}
					{#if containsView(property.visibleInViews, View.LIST)}
						{@const propertyRef = getPropertyRef(item.properties, property.id)}
						{#if propertyRef}
							{@const color = getPropertyColor(property, propertyRef.value)}
							{@const value = getPropertyValue(property, propertyRef.value, false)}
							<PropertyValue itemId={item.id} {property} {color} {value} {updPropertyValue} />
						{/if}
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
