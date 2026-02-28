<script lang="ts">
	import Help from 'lucide-svelte/icons/circle-help';
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
	import {
		Accordion,
		AccordionItem,
		Badge,
		MockCheckbox,
		Tooltip
	} from '$lib/components/base/index.js';
	import { capitalizeFirstLetter, getOption, getPropertyColor } from '$lib/utils/index.js';
	import { getPropertyState } from '$lib/components/property/index.js';
	import { GROUPABLE_PROPERTY_TYPES } from '$lib/constant/index.js';

	type Props = {
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { view, items, ...rest }: Props = $props();
	const propertyState = getPropertyState();

	function shouldRenderEmptyGroups(len: number) {
		if (view.hideEmptyGroups) return len !== 0;
		return true;
	}
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
				<div class="grow space-y-2">
					<div class="h-full flex gap-x-4 pb-4 overflow-x-auto">
						{#each Object.keys(groupedItems) as key (`group-item-${key}`)}
							{#if shouldRenderEmptyGroups(groupedItems[key].length)}
								{@const color = getPropertyColor(targetProperty, key)}
								<ItemBoardView {key} {view} items={groupedItems[key]} {...rest}>
									{#snippet header()}
										{@render groupLabel(key, targetProperty, color, groupedItems[key].length)}
									{/snippet}
								</ItemBoardView>
							{/if}
						{/each}
					</div>
				</div>
			{:else}
				<Accordion isMulti value={Object.keys(groupedItems).map((k) => `accordion-item-${k}`)}>
					{#each Object.keys(groupedItems) as key (`group-item-${key}`)}
						{#if shouldRenderEmptyGroups(groupedItems[key].length)}
							{@const color = getPropertyColor(targetProperty, key)}
							<AccordionItem id={`accordion-item-${key}`}>
								{#snippet header()}
									{@render groupLabel(key, targetProperty, color, groupedItems[key].length)}
								{/snippet}
								{@render itemView(groupedItems[key])}
							</AccordionItem>
						{/if}
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
		{:else if view.type === ViewType.BOARD}
			<ItemBoardView key="" {view} {items} {...rest}>
				{#snippet header()}
					<div class="w-full flex justify-center items-center gap-x-2">
						<span> This collection does not contain properties that support grouping </span>
						<Help id="help-id" />
						<Tooltip triggerBy="help-id">
							Grouping properties:
							<br />
							{GROUPABLE_PROPERTY_TYPES.map((p) => capitalizeFirstLetter(p)).join(', ')}
						</Tooltip>
					</div>
				{/snippet}
			</ItemBoardView>
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

		{#if !view.hideItemCounts}
			<span class="text-sm font-semibold"> {count} </span>
		{/if}
	</div>
{/snippet}
