<script lang="ts">
	import ArrowDownUp from 'lucide-svelte/icons/arrow-down-up';
	import MoveDown from 'lucide-svelte/icons/move-down';
	import MoveUp from 'lucide-svelte/icons/move-up';
	import X from 'lucide-svelte/icons/x';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		HSeparator,
		MenuTitle,
		Tooltip
	} from '$lib/components/base/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { capitalizeFirstLetter, useId } from '$lib/utils/index.js';
	import { getPropertyState, PropertyIcon } from '$lib/components/property/index.js';
	import { PropertyType, SortType, type Sort } from '@prisma/client';
	import { NAME_FIELD } from '$lib/constant/index.js';

	type Props = {
		sorts: Sort[];
		updSorts: (sorts: Sort[]) => void;
	};

	let { sorts, updSorts }: Props = $props();

	const id = useId();
	const menuState = new ModalState();
	const propertyState = getPropertyState();

	function getProperty(id: string) {
		return propertyState.properties.find((property) => property.id === id);
	}

	function addSort(sort: Sort) {
		updSorts([...sorts, { ...sort }]);
	}

	function removeSort(field: string) {
		updSorts(sorts.filter((s) => s.field != field));
	}

	function toggleOrder(sort: Sort) {
		const order = sort.order === SortType.ASC ? SortType.DESC : SortType.ASC;
		const result = sorts.map((s) => (s.field != sort.field ? s : { ...sort, order }));
		updSorts(result);
	}

	function isSort(field: string) {
		return sorts.some((s) => s.field === field);
	}
</script>

<Tooltip triggerBy={id} align="end">
	<span class="text-sm font-semibold py-1 px-1.5">Sort</span>
</Tooltip>

<AdaptiveWrapper
	{id}
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'secondary', variant: 'icon' })}
	floatingAlign="end"
>
	{#snippet trigger()}
		<ArrowDownUp />
	{/snippet}
	<MenuTitle title="Sort by" />

	{#if sorts.length > 0}
		<p class="w-full text-xs font-semibold px-2 py-0.5">Active</p>
		<div class="w-full space-y-0.5 px-0.5 pb-0.5">
			{#each sorts as sort}
				{#if sort.field === NAME_FIELD}
					{@render activeSortRow(sort, capitalizeFirstLetter(NAME_FIELD), PropertyType.TEXT)}
				{:else}
					{@const property = getProperty(sort.field)}
					{#if property}
						{@render activeSortRow(sort, property.name, property.type)}
					{/if}
				{/if}
			{/each}
		</div>

		<HSeparator />
	{/if}
	{#if !isSort(NAME_FIELD)}
		<Button
			theme="ghost"
			variant="menu"
			onclick={() => addSort({ field: NAME_FIELD, order: SortType.ASC })}
		>
			<PropertyIcon key={PropertyType.TEXT} />
			Name
		</Button>
	{/if}

	{#each propertyState.properties as property}
		{#if !isSort(property.id)}
			<Button
				theme="ghost"
				variant="menu"
				onclick={() => addSort({ field: property.id, order: SortType.ASC })}
			>
				<PropertyIcon key={property.type} class="size-4 mr-0" />
				{property.name}
			</Button>
		{/if}
	{/each}
</AdaptiveWrapper>

{#snippet activeSortRow(sort: Sort, name: string, key: PropertyType)}
	{@const Icon = sort.order === SortType.ASC ? MoveUp : MoveDown}
	<div class="flex items-center justify-between gap-x-0.5 px-1 font-semibold">
		<span class="grow flex items-center gap-x-1">
			<PropertyIcon {key} class="size-3.5" />
			{name}
		</span>
		<Button theme="secondary" variant="compact" onclick={() => toggleOrder(sort)}>
			<Icon />
			<span> {capitalizeFirstLetter(sort.order)} </span>
		</Button>

		<Button theme="secondary" variant="compact" onclick={() => removeSort(sort.field)}>
			<X />
		</Button>
	</div>
{/snippet}
