<script lang="ts">
	import PanelLeftOpen from 'lucide-svelte/icons/panel-left-open';
	import Settings from 'lucide-svelte/icons/settings-2';

	import { cn } from '$lib/utils';
	import { type Property, type Item, type Aggregator, View, PropertyType } from '@prisma/client';
	import { getActiveItemState, getItemState, ItemMenu } from '.';
	import {
		PropertyValue,
		PropertyIcon,
		containsView,
		// helpers
		getPropertyRef,
		getPropertyValue,
		toggleView,
		getPropertyState
	} from '$lib/components/property';
	import { fade } from 'svelte/transition';
	import {
		Button,
		buttonVariants,
		HSeparator,
		Label,
		Menu,
		Switch
	} from '$lib/components/base/index.js';
	import { getScreenSizeState } from '$lib/components/screen';
	import { DEBOUNCE_INTERVAL, MAX_ITEM_NAME_LENGTH } from '$lib/constant';
	import type { RouterInputs } from '$lib/trpc/router';
	import debounce from 'debounce';

	type Props = {
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { items, clickOpenItem }: Props = $props();

	const activeItem = getActiveItemState();

	const isLargeScreen = getScreenSizeState();
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
		updItemDebounced({ id, data: { name } });
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
					{@render viewVisibilityMenu()}
				</th>
				<th scope="col" class=" text-left rounded-t-md hover:bg-muted/90 py-2 px-4 cursor-pointer">
					<span class="flex items-center">
						<PropertyIcon key={PropertyType.TEXT} class="icon-xs mr-2" />
						Name
					</span>
				</th>
				{#each propertyState.properties as property (property.id)}
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
					<td colspan={propertyState.properties.length + 3}>
						<div class="empty" in:fade>No items found.</div>
					</td>
				</tr>
			{/if}
			{#if items.length > 0}
				{#each items as item (item.id)}
					<tr
						class={cn(
							'font-medium text-base whitespace-nowrap w-96 border-y border-secondary hover:bg-muted/40 group',
							item.id === activeItem.id && 'outline outline-2 outline-primary/70'
						)}
					>
						<td class="min-w-10 px-1 border border-l-0">
							<div class="flex justify-between items-center space-x-2">
								<ItemMenu id={item.id} name={item.name} {clickOpenItem} align="start" />
								<Button
									theme="secondary"
									variant="icon"
									onclick={() => clickOpenItem(item.id)}
									class={cn(!isLargeScreen.current ? 'h-7 py-0.5 px-1.5 rounded' : 'hidden')}
								>
									Open
								</Button>
							</div>
						</td>
						<td class="flex items-center justify-between pl-2">
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
								class="hidden md:flex items-center py-0.5 px-1 gap-x-1 invisible group-hover:visible "
							>
								<span> Open </span>

								<PanelLeftOpen />
							</Button>
						</td>

						{#each propertyState.properties as property (property.id)}
							{#if containsView(property.visibleInViews, View.TABLE)}
								<td class="border last:border-r-0">
									<PropertyValue view={View.TABLE} {property} itemId={item.id} />
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
				<tr>
					<td></td>
					<td></td>
					{#each propertyState.properties as property (property.id)}
						{#if property.visibleInViews.some((v) => v === View.LIST)}
							{#if property.aggregator === 'NONE'}
								<td></td>
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

{#snippet viewVisibilityMenu()}
	<Menu triggerClass={buttonVariants({ theme: 'ghost' })} align="start">
		{#snippet trigger()}
			<Settings />
		{/snippet}

		<p class="py-1.5 px-2 text-sm font-semibold">Toggle properties visibility</p>

		<HSeparator />

		{#each propertyState.properties as property (property.id)}
			<div class="flex justify-between items-center">
				<Label id={property.id} name={property.name} icon={property.type.toLowerCase()}></Label>
				<Switch
					id={property.id}
					checked={containsView(property.visibleInViews, View.TABLE)}
					onchange={() => {
						propertyState.updProperty({
							id: property.id,
							visibleInViews: toggleView(property.visibleInViews, View.TABLE)
						});
					}}
				/>
			</div>
		{/each}
	</Menu>
{/snippet}
