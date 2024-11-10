<script lang="ts">
	import { cn } from '$lib/utils';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
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
	import { PanelLeftOpen, Settings2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { getScreenState } from '$lib/components/screen';
	import { DEBOUNCE_INTERVAL, MAX_ITEM_NAME_LENGTH } from '$lib/constant';
	import type { RouterInputs } from '$lib/trpc/router';
	import debounce from 'debounce';

	type Props = {
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { items, clickOpenItem }: Props = $props();

	const activeItem = getActiveItemState();

	const isDesktop = getScreenState();
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
								<ItemMenu id={item.id} name={item.name} {clickOpenItem} />
								<Button
									variant="secondary"
									size="sm"
									on:click={() => clickOpenItem(item.id)}
									class={cn(!$isDesktop ? 'h-7 py-0.5 px-1.5 rounded' : 'hidden')}
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
								variant="secondary"
								size="sm"
								on:click={() => clickOpenItem(item.id)}
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

						{#each propertyState.properties as property (property.id)}
							{#if containsView(property.visibleInViews, View.TABLE)}
								<td class="border last:border-r-0">
									<PropertyValue isTableView {property} itemId={item.id} />
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
	{#if $isDesktop}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="ghost" size="xs" builders={[builder]}>
					<Settings2 class="icon-xs" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start" class="w-56">
				<DropdownMenu.Label>Toggle properties visibility</DropdownMenu.Label>
				<DropdownMenu.Separator />

				<div class="p-1 space-y-2">
					{#each propertyState.properties as property (property.id)}
						<div class="flex justify-between items-center">
							<Label for={property.id} class="flex items-center text-sm font-semibold">
								<PropertyIcon key={property.type} />
								{property.name}
							</Label>
							<Switch
								id={property.id}
								checked={containsView(property.visibleInViews, View.TABLE)}
								onCheckedChange={() => {
									propertyState.updProperty({
										id: property.id,
										visibleInViews: toggleView(property.visibleInViews, View.TABLE)
									});
								}}
							/>
						</div>
					{/each}
				</div>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<Drawer.Root>
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} variant="ghost" size="xs">
					<Settings2 class="icon-xs" />
				</Button>
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header class="py-1">
					<div class="flex items-center space-x-2">
						<div class="p-2.5 rounded bg-secondary">
							<Settings2 class="icon-sm" />
						</div>
						<div class="text-base font-semibold">Toggle properties visibility</div>
					</div>
				</Drawer.Header>
				<Drawer.Footer>
					<div class="p-1 space-y-2.5">
						{#each propertyState.properties as property (property.id)}
							<div class="flex justify-between items-center">
								<Label for={property.id} class="flex items-center text-base ">
									<PropertyIcon key={property.type} class="icon-md mr-2" />
									{property.name}
								</Label>
								<Switch
									id={property.id}
									checked={containsView(property.visibleInViews, View.TABLE)}
									onCheckedChange={() => {
										propertyState.updProperty({
											id: property.id,
											visibleInViews: toggleView(property.visibleInViews, View.TABLE)
										});
									}}
								/>
							</div>
						{/each}
					</div>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
{/snippet}
