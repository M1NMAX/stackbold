<script lang="ts">
	import { ItemContextMenu } from '$lib/components';
	import { PropertyValue } from '$lib/components/property';
	import type { Property, PropertyRef, Item } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils';

	export let items: Item[];
	export let currActiveItemId: string | undefined = undefined;
	export let collectionProperties: Property[];

	const dispatch = createEventDispatcher<{ clickOpenItem: string }>();

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
	// class="invisible group-hover:visible"
</script>

<div class="h-full space-y-2 grow overflow-y-auto">
	{#each items as item}
		<div
			tabindex="0"
			role="button"
			on:click|self={() => dispatch('clickOpenItem', item.id)}
			on:keydown={(e) => {
				if (e.key === 'Enter') {
					dispatch('clickOpenItem', item.id);
				}
			}}
			class={cn(
				'relative flex flex-col items-start  py-1 px-2 space-y-2 group  rounded bg-secondary/40 hover:bg-secondary/50',
				item.id === currActiveItemId && 'rounded-l-md border-r-2 border-primary bg-secondary/80'
			)}
		>
			<div class="text-lg font-semibold">
				{item.name}
			</div>

			<ItemContextMenu
				itemId={item.id}
				on:clickRenameItem
				on:clickDuplicateItem
				on:clickDeleteItem
				class={cn('absolute right-2 top-0 invisible group-hover:visible')}
			/>

			<div class="flex flex-wrap gap-2">
				{#each collectionProperties as property (property.id)}
					{#if property.isVisibleOnListView}
						{@const itemProperty = getItemProperty(property.id, item.properties)}
						{#if itemProperty}
							<PropertyValue
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
