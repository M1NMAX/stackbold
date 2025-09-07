<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import PanelLeftOpen from 'lucide-svelte/icons/panel-left-open';
	import { tm } from '$lib/utils/index.js';
	import { type Property, type Item, PropertyType, Aggregator, type View } from '@prisma/client';
	import { getItemState, ItemMenu } from './index.js';
	import {
		PropertyValue,
		PropertyIcon,
		PropertyAggregatorMenu,
		getPropertyRef,
		getPropertyState,
		isPropertyVisible
	} from '$lib/components/property';
	import { fade } from 'svelte/transition';
	import { Button } from '$lib/components/base/index.js';
	import {
		DEBOUNCE_INTERVAL,
		ITEMS_CHUNK_SIZE,
		MAX_ITEM_NAME_LENGTH
	} from '$lib/constant/index.js';
	import type { RouterInputs } from '$lib/trpc/router';
	import debounce from 'debounce';

	type Props = {
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { view, items, clickOpenItem }: Props = $props();
	let multiplier = $state(1);
	const renderLimit = $derived(ITEMS_CHUNK_SIZE * multiplier);

	const propertyState = getPropertyState();
	const itemState = getItemState();

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);
	async function updItem(args: RouterInputs['items']['update']) {
		itemState.updItem(args);
	}

	//TODO: validate value
	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;

		const id = targetEl.dataset.id!;
		const name = targetEl.value;
		updItemDebounced({ id, name });
	}

	function aggregatePropertyValue(property: Property) {
		if (!property.aggregator) return '';
		else if (property.aggregator === Aggregator.COUNT) return items.length;
		else if (property.aggregator === Aggregator.COUNT_EMPTY) {
			return items.reduce((acc, item) => {
				const propertyRef = getPropertyRef(item.properties, property.id);
				if (propertyRef == null || propertyRef.value === '') return acc + 1;
				return acc;
			}, 0);
		} else if (property.aggregator === Aggregator.COUNT_NOT_EMPTY) {
			return items.reduce((acc, item) => {
				const propertyRef = getPropertyRef(item.properties, property.id);
				if (propertyRef && propertyRef.value !== '') return acc + 1;
				return acc;
			}, 0);
		} else if (property.aggregator === Aggregator.SUM || property.aggregator === Aggregator.AVG) {
			const sum = items.reduce((acc, curr) => {
				const propertyRef = getPropertyRef(curr.properties, property.id);
				const inc = propertyRef ? propertyRef.value : 0;
				return acc + Number(inc);
			}, 0);
			if (property.aggregator === Aggregator.SUM) return sum.toFixed(2);
			return (sum / items.length).toFixed(2);
		}
		return '';
	}
</script>

<div class="overflow-x-auto pb-1.5">
	<table class="w-full table-auto">
		<thead>
			<tr class="text-muted-foreground text-sm">
				<th scope="col" class="text-left rounded-t-md hover:bg-muted/90 py-2 px-4 cursor-pointer">
					<span class="flex items-center">
						<PropertyIcon key={PropertyType.TEXT} class="size-4 mr-2" />
						Name
					</span>
				</th>
				{#each propertyState.properties as property (property.id)}
					{#if isPropertyVisible(view, property.id)}
						<th
							scope="col"
							class="text-left text-nowrap rounded-t-md hover:bg-muted/90 py-2 px-4 md:px-2 cursor-pointer"
						>
							<span class="flex items-center">
								<PropertyIcon key={property.type} class="size-4 mr-2" />
								{property.name}
							</span>
						</th>
					{/if}
				{/each}

				<th scope="col" class="text-left w-8" title="Row actions"> </th>
			</tr>
		</thead>
		<tbody>
			{#if items.length === 0}
				<tr>
					<td colspan={propertyState.properties.length + 3}>
						<div class="empty" in:fade>No items found.</div>
					</td>
				</tr>
			{/if}
			{#if items.length > 0}
				{#each items.slice(0, renderLimit) as item (item.id)}
					<tr
						class={tm(
							'font-medium text-base whitespace-nowrap border-y border-secondary hover:bg-muted/40 group',
							item.id === itemState.active && 'outline outline-2 outline-primary/70'
						)}
					>
						<td class="flex items-center justify-between pl-2 pr-1">
							<input
								data-id={item.id}
								value={item.name}
								oninput={handleOnInput}
								maxlength={MAX_ITEM_NAME_LENGTH}
								class="grow py-2 px-1 focus:outline-none bg-inherit"
							/>

							<Button
								theme="secondary"
								onclick={() => clickOpenItem(item.id)}
								class="md:invisible md:group-hover:visible"
							>
								<PanelLeftOpen class="hidden md:block" />
								<span> Open </span>
							</Button>
						</td>

						{#each propertyState.properties as property (property.id)}
							{#if isPropertyVisible(view, property.id)}
								<td class="border last:border-r-0 px-2">
									<PropertyValue {view} {property} {item} />
								</td>
							{/if}
						{/each}
						<td class="pl-1">
							<ItemMenu id={item.id} name={item.name} {clickOpenItem} align="start" />
						</td>
					</tr>
				{/each}
				{#if items.length > renderLimit}
					<tr>
						<td colspan={propertyState.properties.length + 3}>
							<Button theme="ghost" variant="menu" onclick={() => (multiplier += 1)}>
								<ArrowDown />
								Load more
							</Button>
						</td>
					</tr>
				{/if}
				<tr>
					<td></td>

					{#each propertyState.properties as property (property.id)}
						{#if isPropertyVisible(view, property.id)}
							<td>
								<div class="flex w-full justify-end group">
									<PropertyAggregatorMenu
										{property}
										calculated={aggregatePropertyValue(property).toString()}
										onchange={(aggregator) => {
											propertyState.updProperty({ id: property.id, aggregator });
										}}
									/>
								</div>
							</td>
						{/if}
					{/each}

					<td></td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
