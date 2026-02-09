<script lang="ts">
	import {
		Color,
		type Item,
		type Property,
		PropertyType,
		type View,
		ViewType
	} from '@prisma/client';
	import {
		getInitialItemsGroup,
		groupItemsByPropertyValue,
		ItemBoardView,
		ItemListView,
		ItemTableView
	} from './index.js';
	import { Accordion, AccordionItem, Badge, MockCheckbox } from '$lib/components/base/index.js';
	import { getOption, getPropertyColor } from '$lib/utils/index.js';
	import { getPropertyState } from '$lib/components/property/index.js';

	type Props = {
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { view, items, ...rest }: Props = $props();
	const propertyState = getPropertyState();
</script>

{#if items.length > 0}
	{#if !view.groupBy}
		{@render itemView(items)}
	{:else}
		{@const targetProperty = propertyState.getProperty(view.groupBy)}
		{#if targetProperty}
			{@const groupedItems = items.reduce(
				groupItemsByPropertyValue(view.groupBy),
				getInitialItemsGroup(targetProperty)
			)}

			{#if view.type === ViewType.BOARD}
				<div class="flex gap-x-4 overflow-x-auto hd-scroll">
					{#each Object.keys(groupedItems) as key (`group-item-${key}`)}
						{@const color = getPropertyColor(targetProperty, key)}

						<ItemBoardView {key} {view} items={groupedItems[key]} {...rest}>
							{#snippet header()}
								{@render groupLabel(key, targetProperty, color, groupedItems[key].length)}
							{/snippet}
						</ItemBoardView>
					{/each}
				</div>
			{:else}
				<Accordion isMulti value={Object.keys(groupedItems).map((k) => `accordion-item-${k}`)}>
					{#each Object.keys(groupedItems) as key (`group-item-${key}`)}
						{@const color = getPropertyColor(targetProperty, key)}
						<AccordionItem id={`accordion-item-${key}`}>
							{#snippet header()}
								{@render groupLabel(key, targetProperty, color, groupedItems[key].length)}
							{/snippet}
							{@render itemView(groupedItems[key])}
						</AccordionItem>
					{/each}
				</Accordion>
			{/if}
		{/if}
	{/if}
{/if}

{#snippet itemView(items: Item[])}
	<div class="grow space-y-2">
		{#if view.type === ViewType.TABLE}
			<ItemTableView {view} {items} {...rest} />
		{:else if view.type === ViewType.LIST}
			<ItemListView {view} {items} {...rest} />
		{/if}
	</div>
{/snippet}

{#snippet groupLabel(key: string, property: Property, color: Color, count: number)}
	<div class="flex items-center gap-2">
		<Badge {color}>
			{#if property.type === PropertyType.CHECKBOX}
				<MockCheckbox checked={key === 'true'} />
				{property.name}
			{:else}
				{@const option = getOption(property.options, key)}
				{option ? option.value : `No ${property.name}`}
			{/if}
		</Badge>

		<span class="text-sm font-semibold"> {count} </span>
	</div>
{/snippet}
