<script lang="ts">
	import type { IBaseSchema, OrderType } from '$lib/utils';
	import type { CollectionProperty, Item, ItemProperty as ItemPropertyType } from '@prisma/client';
	import { ItemContextMenu, ItemProperty, SortArrow } from '$lib/components';
	import dayjs from '$lib/utils/dayjs';

	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	import { PanelLeftOpen, Settings2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	export let items: Item[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: CollectionProperty[];
	export let order: OrderType = 'asc';

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		clickTableHead: { field: keyof IBaseSchema };
	}>();

	const getItemProperty = (pid: string, properties: ItemPropertyType[]) => {
		return properties.find((property) => property.id === pid) || null;
	};

	const getOptionValue = (property: CollectionProperty, value: string) => {
		const option = property.options.find((opt) => opt.id === value);
		return option ? option.id : '';
	};

	const getOptionColor = (property: CollectionProperty, value: string) => {
		const option = property.options.find((opt) => opt.id === value);
		return option ? option.color : 'GRAY';
	};
</script>

<table class="w-full">
	<thead class="">
		<tr class="text-gray-500 text-sm">
			<th scope="col" class="text-left rounded-t-md hover:bg-base-200 py-2 px-1 cursor-pointer">
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
				<th scope="col" class="text-left rounded-t-md hover:bg-base-200 py-2 px-1 cursor-pointer">
					{property.name}
				</th>
			{/each}
			<th
				scope="col"
				class="whitespace-nowrap text-left rounded-t-md hover:bg-base-200 py-2 px-1 cursor-pointer"
			>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					on:click={() => dispatch('clickTableHead', { field: 'updatedAt' })}
					class="flex justify-between items-center"
				>
					<span> Last updated </span>
					<SortArrow bind:order />
				</div>
			</th>

			<th scope="col" class="text-left" title="Row actions">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button variant="outline" builders={[builder]}>
							<Settings2 class="w-4 h-4" />
							View
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56">
						<DropdownMenu.Label>Toggle columns</DropdownMenu.Label>
						<DropdownMenu.Separator />

						{#each collectionProperties as property (property.id)}
							<DropdownMenu.CheckboxItem>
								{property.name}
							</DropdownMenu.CheckboxItem>
						{/each}

						<DropdownMenu.CheckboxItem>Updated</DropdownMenu.CheckboxItem>
						<DropdownMenu.CheckboxItem>Created</DropdownMenu.CheckboxItem>
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
						item.id === currActiveItemId
							? ' bg-gray-200/50 border-r-2 border-t-0 border-b-0 border-primary'
							: ''
					} font-medium text-base border-y-2 border-gray-100 hover:bg-base-200`}
				>
					<td class="text-left py-2 px-1"> {item.name}</td>

					{#each collectionProperties as property (property.id)}
						{@const itemProperty = getItemProperty(property.id, item.properties)}
						<td class="text-left py-2 px-1">
							{#if itemProperty}
								<ItemProperty
									itemId={item.id}
									{property}
									color={property.type === 'SELECT'
										? getOptionColor(property, itemProperty.value)
										: 'GRAY'}
									value={property.type === 'SELECT'
										? getOptionValue(property, itemProperty.value)
										: itemProperty.value}
									on:updPropertyValue
								/>
							{/if}
						</td>
					{/each}
					<td class="whitespace-nowrap text-left py-2 px-1">
						{dayjs(item.updatedAt).fromNow()}
					</td>

					<td class="text-left whitespace-nowrap px-2">
						<ItemContextMenu
							itemId={item.id}
							on:clickHideItem
							on:clickDuplicateItem
							on:clickDeleteItem
						/>

						<Button variant="outline" size="xs" on:click={() => dispatch('clickOpenItem', item.id)}>
							<PanelLeftOpen class="icon-xs" />
						</Button>
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
