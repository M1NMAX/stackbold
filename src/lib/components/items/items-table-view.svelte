<script lang="ts">
	import { cn } from '$lib/utils';
	import { type Property, type Item, type Aggregator, View, PropertyType } from '@prisma/client';
	import { getActiveItemState, ItemMenu, ItemsTableViewVisibilityMenu } from '.';
	import {
		PropertyValue,
		PropertyIcon,
		containsView,
		// helpers
		getPropertyColor,
		getPropertyRef,
		getPropertyValue,
		toggleView
	} from '$lib/components/property';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { PanelLeftOpen } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { getScreenState } from '$lib/components/view';

	export let items: Item[];
	export let properties: Property[];

	const activeItem = getActiveItemState();

	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		updPropertyVisibility: { pid: string; name: string; value: View[] };
		renameItem: { id: string; name: string };
	}>();

	//TODO: validate inner text
	function handleOnInput(e: { currentTarget: EventTarget & HTMLDivElement }) {
		const targetEl = e.currentTarget;

		const id = targetEl.dataset.id!;
		const name = targetEl.innerText;
		dispatch('renameItem', { id, name });
	}

	function preventEnterKeypress(e: KeyboardEvent) {
		if (e.key === 'Enter') e.preventDefault();
	}

	function aggregatePropertyValue(property: Property, type: Aggregator) {
		if (type === 'COUNT') return items.length;
		if (type === 'COUNT_EMPTY') {
			return items.reduce((acc, item) => {
				const propertyRef = getPropertyRef(item.properties, property.id);
				if (propertyRef == null || propertyRef.value === '') return acc + 1;
				return acc;
			}, 0);
		}
		if (type === 'COUNT_NOT_EMPTY') {
			return items.reduce((acc, item) => {
				const propertyRef = getPropertyRef(item.properties, property.id);
				if (propertyRef && propertyRef.value !== '') return acc + 1;
				return acc;
			}, 0);
		}
		if (type === 'SUM' || type === 'AVG') {
			const sum = items.reduce((acc, curr) => {
				const propertyRef = getPropertyRef(curr.properties, property.id);
				const inc = propertyRef ? getPropertyValue(property, propertyRef.value) : 0;
				return acc + Number(inc);
			}, 0);
			if (type === 'SUM') return sum.toFixed(2);
			return (sum / items.length).toFixed(2);
		}
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full table-auto">
		<thead>
			<tr class="text-muted-foreground text-sm">
				<th scope="col" class="text-left w-10" title="Row actions">
					<ItemsTableViewVisibilityMenu {properties} on:updPropertyVisibility />
				</th>
				<th scope="col" class=" text-left rounded-t-md hover:bg-muted/90 py-2 px-4 cursor-pointer">
					<span class="flex items-center">
						<PropertyIcon key={PropertyType.TEXT} class="icon-xs mr-2" />
						Name
					</span>
				</th>
				{#each properties as property (property.id)}
					{#if containsView(property.visibleInViews, View.TABLE)}
						<th
							scope="col"
							class=" text-left text-nowrap rounded-t-md hover:bg-muted/90 py-2 px-4 md:px-2 cursor-pointer"
						>
							<span class="flex items-center">
								<PropertyIcon key={property.type} class="icon-xs mr-2" />
								{property.name}
							</span>
						</th>
					{/if}
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if items.length === 0}
				<tr>
					<td colspan={properties.length + 3}>
						<div class="empty" in:fade>No items found.</div>
					</td>
				</tr>
			{/if}
			{#if items.length > 0}
				{#each items as item (item.id)}
					<tr
						class={cn(
							'font-medium text-base whitespace-nowrap w-96 border-y border-secondary hover:bg-muted/40 group',
							item.id === $activeItem?.id && 'outline outline-2 outline-primary/70'
						)}
					>
						<td class="min-w-10 px-1 border border-l-0">
							<div class="flex justify-between items-center space-x-2">
								<ItemMenu
									itemId={item.id}
									on:clickOpenItem
									on:clickDuplicateItem
									on:clickDeleteItem
								/>
								<Button
									variant="secondary"
									size="sm"
									on:click={() => dispatch('clickOpenItem', item.id)}
									class={cn(!$isDesktop ? 'h-7 py-0.5 px-1.5 rounded' : 'hidden')}
								>
									Open
								</Button>
							</div>
						</td>
						<td class="flex items-center justify-between pl-2">
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								contenteditable
								spellcheck={false}
								on:keypress={preventEnterKeypress}
								on:input={handleOnInput}
								data-id={item.id}
								class=" text-left py-2 px-1 focus:outline-none"
							>
								{item.name}
							</div>

							<Button
								variant="secondary"
								size="sm"
								on:click={() => dispatch('clickOpenItem', item.id)}
								class={cn(
									$isDesktop
										? 'items-center space-x-2 py-0.5 px-1 rounded invisible group-hover:visible'
										: 'hidden'
								)}
							>
								<span> Open </span>

								<PanelLeftOpen class="icon-xs" />
							</Button>
						</td>

						{#each properties as property (property.id)}
							{@const propertyRef = getPropertyRef(item.properties, property.id)}
							{#if containsView(property.visibleInViews, View.TABLE) && propertyRef}
								{@const color = getPropertyColor(property, propertyRef.value)}
								{@const value = getPropertyValue(property, propertyRef.value, false)}

								<td class="border last:border-r-0">
									{#if propertyRef}
										<PropertyValue
											isTableView
											{property}
											{color}
											{value}
											itemId={item.id}
											on:updPropertyValue
										/>
									{/if}
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
				<tr>
					<td />
					<td />
					{#each properties as property (property.id)}
						{#if property.visibleInViews.some((v) => v === View.LIST)}
							{#if property.aggregator === 'NONE'}
								<td />
							{:else}
								<td class="text-right text-nowrap px-2">
									<span class="text-[0.65rem] font-medium"> {property.aggregator}</span>
									<span class="font-semibold">
										{aggregatePropertyValue(property, property.aggregator)}
									</span>
								</td>
							{/if}
						{/if}
					{/each}
				</tr>
			{/if}
		</tbody>
	</table>
</div>
