<script lang="ts">
	import { WindowOutline } from 'flowbite-svelte-icons';
	import { IconBtn, ItemContextMenu, ItemProperty } from '$lib/components';
	import type { CollectionProperty, Item, ItemProperty as ItemPropertyType } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';

	export let items: Item[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: CollectionProperty[];

	const dispatch = createEventDispatcher<{ clickOpenItem: string }>();

	const getItemProperty = (pid: string, properties: ItemPropertyType[]) => {
		return properties.find((property) => property.id === pid) || null;
	};

	const getOptionValue = (property: CollectionProperty, value: string) => {
		const option = property.options.find((opt) => opt.id === value);
		return option ? option.value : '';
	};

	const getOptionColor = (property: CollectionProperty, value: string) => {
		const option = property.options.find((opt) => opt.id === value);
		return option ? option.color : 'GRAY';
	};
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
					on:clickHideItem
					on:clickDuplicateItem
					on:clickDeleteItem
				/>

				<IconBtn
					on:click={() => dispatch('clickOpenItem', item.id)}
					class="invisible group-hover:visible"
				>
					<WindowOutline class="rotate-90" />
				</IconBtn>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each collectionProperties as property (property.id)}
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
				{/each}
			</div>
		</div>
	{/each}
</div>
