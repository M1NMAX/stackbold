<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Property, Item } from '@prisma/client';
	import { getActiveItemState, ItemMenu } from '.';
	import {
		PropertyValue,
		// helpers
		getOptionColor,
		getOptionValue,
		getPropertyRef
	} from '$lib/components/property';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { PanelLeftOpen, Settings2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	export let items: Item[];
	export let properties: Property[];

	const activeItem = getActiveItemState();

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		updPropertyVisibility: { pid: string; name: string; value: boolean };
	}>();
</script>

<table class="w-full">
	<thead class="">
		<tr class="text-muted-foreground text-sm">
			<th scope="col" class="text-left rounded-t-md hover:bg-muted/90 py-2 px-1 cursor-pointer">
				Name
			</th>
			{#each properties as property (property.id)}
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

						{#each properties as property (property.id)}
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
					class={cn(
						'font-medium text-base border-y  border-secondary  hover:bg-opacity-20  group',
						item.id === $activeItem?.id && 'bg-card/50 border-r-2 border-y-0  border-primary'
					)}
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

					{#each properties as property (property.id)}
						{@const propertyRef = getPropertyRef(item.properties, property.id)}
						{#if property.isVisibleOnTableView && propertyRef}
							{@const color = getOptionColor(property, propertyRef.value)}
							{@const value = getOptionValue(property, propertyRef.value)}

							<td class="text-left border">
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

					<td class="flex items-center space-x-2 text-left whitespace-nowrap px-2">
						<ItemMenu itemId={item.id} on:clickDuplicateItem on:clickDeleteItem />
					</td>
				</tr>
			{/each}
		{:else}
			<tr>
				<td colspan={properties.length + 3}>
					<div class="empty" in:fade>
						<!-- <div class="empty-icon"><IconEmpty size="5em" /></div> -->
						No items found.
					</div>
				</td>
			</tr>
		{/if}
	</tbody>
</table>
