<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ItemContextMenu, ItemProperty } from '$lib/components';
	import type { CollectionProperty, Item, ItemProperty as ItemPropertyType } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { PanelLeftOpen } from 'lucide-svelte';

	export let items: Item[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: CollectionProperty[];

	const dispatch = createEventDispatcher<{ clickOpenItem: string }>();

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
	// class="invisible group-hover:visible"
</script>

<div class="h-full space-y-2 grow overflow-y-auto">
	{#each items as item}
		<div
			class={` ${
				item.id === currActiveItemId
					? 'rounded-l-md border-r-2 border-primary bg-gray-100'
					: 'rounded bg-gray-100'
			} flex flex-col items-start  py-1 px-2 space-y-2 group`}
		>
			<div class="w-full flex justify-between items-center space-x-2">
				<span class="grow text-lg font-semibold">{item.name}</span>

				<ItemContextMenu
					itemId={item.id}
					on:clickRenameItem
					on:clickDuplicateItem
					on:clickDeleteItem
				/>

				<Button variant="outline" size="xs" on:click={() => dispatch('clickOpenItem', item.id)}>
					<PanelLeftOpen class="icon-sm" />
				</Button>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each collectionProperties as property (property.id)}
					{#if property.isVisibleOnListView}
						{@const itemProperty = getItemProperty(property.id, item.properties)}
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
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
