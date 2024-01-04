<script lang="ts">
	import { ItemMenu, getActiveItemState } from '.';
	import { PropertyValue } from '$lib/components/property';
	import type { Property, PropertyRef, Item } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils';

	export let items: Item[];
	export let properties: Property[];

	const activeItem = getActiveItemState();

	const dispatch = createEventDispatcher<{ clickOpenItem: string }>();

	function getPropertyRef(pid: string, properties: PropertyRef[]) {
		return properties.find((property) => property.id === pid) || null;
	}

	function getOptionValue(property: Property, value: string) {
		const option = property.options.find((opt) => opt.id === value);
		return option ? option.id : '';
	}

	function getOptionColor(property: Property, value: string) {
		const option = property.options.find((opt) => opt.id === value);
		return option ? option.color : 'GRAY';
	}
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
				'relative flex flex-col items-start  py-1 px-2 space-y-2 rounded-sm  bg-secondary/40 hover:bg-secondary/50 group',
				item.id === $activeItem?.id && 'rounded-r-none border-r-2 border-primary bg-secondary/80'
			)}
		>
			<div class="text-lg font-semibold">
				{item.name}
			</div>

			<ItemMenu
				itemId={item.id}
				on:clickOpenItem={(e) => dispatch('clickOpenItem', e.detail)}
				on:clickDuplicateItem
				on:clickDeleteItem
				class="absolute right-2 top-0 invisible group-hover:visible"
			/>

			<div class="flex flex-wrap gap-2">
				{#each properties as property (property.id)}
					{#if property.isVisibleOnListView}
						{@const itemProperty = getPropertyRef(property.id, item.properties)}
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
