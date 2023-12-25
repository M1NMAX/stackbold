<script lang="ts">
	import { cn, type IBaseSchema, type OrderType } from '$lib/utils';
	import type { Property, PropertyRef, Item } from '@prisma/client';
	import { ItemContextMenu } from '$lib/components';
	import { PropertyValue } from '$lib/components/property';
	import { SortArrow } from '$lib/components/sort';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { PanelLeftOpen, Settings2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	export let items: Item[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: Property[];
	export let order: OrderType = 'asc';

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		clickTableHead: { field: keyof IBaseSchema };
		updPropertyVisibility: { pid: string; name: string; value: boolean };
	}>();

	const getItemProperty = (pid: string, properties: PropertyRef[]) => {
		return properties.find((property) => property.id === pid) || null;
	};

	const getOptionValue = (property: Property, value: string) => {
		const option = property.options.find((opt) => opt.id === value);
		return option ? option.id : '';
	};

	const getOptionColor = (property: Property, value: string) => {
		const option = property.options.find((opt) => opt.id === value);
		return option ? option.color : 'GRAY';
	};
</script>

<table class="w-full">
	<thead class="">
		<tr class="text-muted-foreground text-sm">
			<th scope="col" class="text-left rounded-t-md hover:bg-muted/90 py-2 px-1 cursor-pointer">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					on:click={() => dispatch('clickTableHead', { field: 'name' })}
					class="flex justify-between items-center"
				>
					<span> Name </span>

					<SortArrow bind:order />
				</div>
			</th>
			{#each collectionProperties as property (property.id)}
				{#if property.isVisibleOnTableView}
					<th scope="col" class="text-left rounded-t-md hover:bg-muted/90 py-2 px-1 cursor-pointer">
						{property.name}
					</th>
				{/if}
			{/each}

			<th scope="col" class="text-left" title="Row actions">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button variant="ghost" size="xs" builders={[builder]}>
							<Settings2 class="icon-xs" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56">
						<DropdownMenu.Label>Toggle property visibility</DropdownMenu.Label>
						<DropdownMenu.Separator />

						{#each collectionProperties as property (property.id)}
							<DropdownMenu.CheckboxItem
								checked={property.isVisibleOnTableView}
								on:click={() => {
									dispatch('updPropertyVisibility', {
										pid: property.id,
										name: 'isVisibleOnTableView',
										value: !property.isVisibleOnTableView
									});
								}}
							>
								{property.name}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</th>
		</tr>
	</thead>
	<tbody>
		{#if items.length}
			{#each items as item (item.id)}
				<tr
					class={`${
						item.id === currActiveItemId && 'bg-card/50 border-r-2 border-y-0  border-primary'
					} font-medium text-base border-y  border-secondary  hover:bg-opacity-20  group`}
				>
					<td class="flex items-center justify-between">
						<span class="text-left py-2 px-1"> {item.name}</span>

						<Button
							variant="secondary"
							size="sm"
							on:click={() => dispatch('clickOpenItem', item.id)}
							class="items-center space-x-2 py-0.5 px-1 rounded invisible group-hover:visible"
						>
							<span> Open </span>

							<PanelLeftOpen class="icon-xs" />
						</Button>
					</td>

					{#each collectionProperties as property (property.id)}
						{@const itemProperty = getItemProperty(property.id, item.properties)}
						{#if property.isVisibleOnTableView && itemProperty}
							{@const value =
								property.type === 'SELECT'
									? getOptionValue(property, itemProperty.value)
									: itemProperty.value}

							{@const color =
								property.type === 'SELECT' ? getOptionColor(property, itemProperty.value) : 'GRAY'}

							<td class="text-left border">
								{#if itemProperty}
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

					<td class="flex items-center space-x-2 text-left whitespace-nowrap px-2">
						<ItemContextMenu
							itemId={item.id}
							on:clickRename
							on:clickDuplicateItem
							on:clickDeleteItem
						/>
					</td>
				</tr>
			{/each}
		{:else}
			<tr>
				<td colspan={collectionProperties.length + 3}>
					<div class="empty" in:fade>
						<!-- <div class="empty-icon"><IconEmpty size="5em" /></div> -->
						No items found.
					</div>
				</td>
			</tr>
		{/if}
	</tbody>
</table>
