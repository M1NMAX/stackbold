<script lang="ts">
	import ArrowDownUp from 'lucide-svelte/icons/arrow-down-up';
	import Check from 'lucide-svelte/icons/check';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Eraser from 'lucide-svelte/icons/eraser';
	import ListCollapse from 'lucide-svelte/icons/list-collapse';
	import ListFilter from 'lucide-svelte/icons/list-filter';
	import Minus from 'lucide-svelte/icons/minus';
	import MoveDown from 'lucide-svelte/icons/move-down';
	import MoveUp from 'lucide-svelte/icons/move-up';
	import Settings from 'lucide-svelte/icons/settings-2';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import X from 'lucide-svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		Checkbox,
		HSeparator,
		Label,
		MenuTitle,
		RadioGroup,
		RadioGroupItem,
		Switch,
		Tooltip
	} from '$lib/components/base/index.js';
	import { PropertyType, SortType, type Filter, type Sort, type View } from '@prisma/client';
	import {
		getOption,
		getPropertyState,
		isPropertyVisible,
		PropertyIcon
	} from '$lib/components/property/index.js';
	import { getViewState, isFilterSeletect, toggleFilter } from './index.js';
	import { capitalizeFirstLetter, tm, useId } from '$lib/utils/index.js';
	import {
		FILTERABLE_PROPERTY_TYPES,
		NAME_FIELD,
		THEME_COLORS,
		VALUE_NONE
	} from '$lib/constant/index.js';
	import type { Nullable } from '$lib/types.js';
	import { getItemState } from '$lib/components/item/index.js';

	type Props = {
		view: View;
	};

	type ContentType = Nullable<'filter' | 'filter-property' | 'sort' | 'group' | 'visibility'>;

	let { view }: Props = $props();

	const id = useId();
	const menuState = new ModalState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const properties = $derived.by(getFilterableProperties);

	let content = $state<ContentType>(null);
	// svelte-ignore state_referenced_locally
	let filterSelectedProperty = $state(properties[0]);

	function getFilterableProperties() {
		return propertyState.properties.filter((prop) => FILTERABLE_PROPERTY_TYPES.includes(prop.type));
	}

	async function togglePropertyVisibility(pid: string) {
		const properties = view.properties.map((p) =>
			p.id !== pid ? p : { ...p, isVisible: !p.isVisible }
		);
		await viewState.updView({ id: view.id, properties });
	}

	async function updViewFilters(filters: Filter[]) {
		await viewState.updView({ id: view.id, filters });
		await itemState.refresh(viewState.viewShortId);
	}

	async function updViewSorts(sorts: Sort[]) {
		await viewState.updView({ id: view.id, sorts });
		await itemState.refresh(viewState.viewShortId);
	}

	async function updViewGroupBy(value: string) {
		menuState.close();
		content = null;
		await viewState.updView({ id: view.id, groupBy: value === '' ? null : value });
	}

	function getFilterValue(id: string) {
		const target = view.filters.find((f) => f.id == id);
		if (!target) return undefined;
		return target.values.length == 1 ? target.values[0] : undefined;
	}

	async function onClickFilterOption(id: string, value: string, type: PropertyType) {
		await updViewFilters(toggleFilter(view.filters, { id, value, type }));
	}

	function hasFilterValues(id: string) {
		const target = view.filters.find((filter) => filter.id === id);
		if (!target) return false;
		return target.values.length > 0;
	}

	async function clearFilter(id: string) {
		await updViewFilters(view.filters.filter((filter) => filter.id !== id));
	}

	async function clearAllFilter() {
		await updViewFilters([]);
	}

	async function addSort(sort: Sort) {
		await updViewSorts([...view.sorts, { ...sort }]);
	}

	async function removeSort(field: string) {
		await updViewSorts(view.sorts.filter((s) => s.field != field));
	}

	async function toggleOrder(sort: Sort) {
		const order = sort.order === SortType.ASC ? SortType.DESC : SortType.ASC;
		const result = view.sorts.map((s) => (s.field != sort.field ? s : { ...sort, order }));
		await updViewSorts(result);
	}

	function isSort(field: string) {
		return view.sorts.some((s) => s.field === field);
	}

	function getProperty(id: string) {
		return propertyState.properties.find((property) => property.id === id);
	}

	$effect(() => {
		if (!menuState.isOpen) content = null;
	});
</script>

<Tooltip triggerBy={id} align="end">View settings</Tooltip>
<AdaptiveWrapper
	{id}
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'secondary', variant: 'icon' })}
	floatingAlign="end"
>
	{#snippet trigger()}
		<Settings />
	{/snippet}
	{#if !content}
		<MenuTitle title="View settings" />

		<Button theme="ghost" variant="menu" onclick={() => (content = 'visibility')}>
			<ToggleRight />
			<span> Property visibility </span>
		</Button>

		<Button theme="ghost" variant="menu" onclick={() => (content = 'filter')}>
			<ListFilter />
			<span> Filter </span>
		</Button>

		<Button theme="ghost" variant="menu" onclick={() => (content = 'sort')}>
			<ArrowDownUp />
			<span> Sort </span>
		</Button>

		<Button theme="ghost" variant="menu" onclick={() => (content = 'group')}>
			<ListCollapse />
			<span> Group </span>
		</Button>
	{:else if content === 'visibility'}
		{@render header('Properties')}
		{#each propertyState.properties as property}
			<div draggable="true" class="flex justify-between items-center pr-1">
				<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
				<Switch
					id={property.id}
					checked={isPropertyVisible(view, property.id)}
					onchange={() => togglePropertyVisibility(property.id)}
				/>
			</div>
		{/each}
	{:else if content === 'filter'}
		{@render header('Filters')}
		{@render activeFilters()}

		{#each properties as property}
			<Button
				theme="ghost"
				variant="menu"
				onclick={() => {
					filterSelectedProperty = property;
					content = 'filter-property';
				}}
			>
				<PropertyIcon key={property.type} />
				{property.name}
			</Button>
		{:else}
			{@render empty('Existing properties do not support filters')}
		{/each}
	{:else if content === 'filter-property'}
		{@render header(`${filterSelectedProperty.name} is`, 'filter')}
		{#if filterSelectedProperty.type === PropertyType.CHECKBOX}
			{@const currValue = getFilterValue(filterSelectedProperty.id)}
			{#key currValue}
				<RadioGroup
					value={currValue}
					onchange={(value) => {
						onClickFilterOption(filterSelectedProperty.id, value, filterSelectedProperty.type);
					}}
				>
					{#each [true, false] as value}
						{@const filterMenuCheckboxId = useId('filter-menu-checkbox')}
						<Label for={filterMenuCheckboxId} compact hoverEffect>
							{@render mockCheckbox(value)}
							<span class="grow font-semibold"> {value ? 'Checked' : 'Unchecked'} </span>

							<RadioGroupItem id={filterMenuCheckboxId} value={value.toString()}></RadioGroupItem>
						</Label>
					{/each}
				</RadioGroup>
			{/key}
		{:else}
			{#each filterSelectedProperty.options as option}
				<Checkbox
					checked={isFilterSeletect(view.filters, {
						id: filterSelectedProperty.id,
						value: option.id
					})}
					onclick={() => {
						onClickFilterOption(filterSelectedProperty.id, option.id, filterSelectedProperty.type);
					}}
				>
					<span class={['size-3.5 rounded-sm', THEME_COLORS[option.color]]}></span>

					<span class="grow font-semibold">
						{option.value}
					</span>
				</Checkbox>
			{/each}
		{/if}
		{@render clearBtn(filterSelectedProperty.id)}
	{:else if content === 'sort'}
		{@render header('Sort by')}
		{@render activeSorts()}
		{#if !isSort(NAME_FIELD)}
			<Button
				theme="ghost"
				variant="menu"
				onclick={() => addSort({ field: NAME_FIELD, order: SortType.ASC })}
			>
				<PropertyIcon key={PropertyType.TEXT} />
				{capitalizeFirstLetter(NAME_FIELD)}
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
	{:else if content === 'group'}
		{@render header('Group By')}

		{#if properties.length > 0}
			<RadioGroup value={view.groupBy ?? ''} onchange={updViewGroupBy}>
				{#each properties as property (property.id)}
					{@const id = useId(`group-by-${property.id}`)}
					<Label for={id} compact hoverEffect>
						<PropertyIcon key={property.type} />
						<span class="grow"> {property.name} </span>
						<RadioGroupItem {id} value={property.id} />
					</Label>
				{/each}
				<Label for="collection-group-by-none" compact hoverEffect>
					<PropertyIcon key="none" />
					<span class="grow">{VALUE_NONE}</span>
					<RadioGroupItem id="collection-group-by-none" value="" />
				</Label>
			</RadioGroup>
		{:else}
			{@render empty('Existing properties do not support grouping')}
		{/if}
	{/if}
</AdaptiveWrapper>

{#snippet header(title: string, backTo: ContentType = null)}
	<div class="w-full flex items-center gap-x-1">
		<Button theme="ghost" variant="cicon" onclick={() => (content = backTo)}>
			<ChevronLeft />
		</Button>
		<span class="grow pr-4 py-1 font-semibold text-sm text-center md:text-left">
			{title}
		</span>
	</div>
	<HSeparator />
{/snippet}

{#snippet activeFilters()}
	{#if view.filters.length > 0}
		<p class="w-full text-xs font-semibold px-2 py-0.5">Active filters</p>
		<div class="w-full flex flex-wrap gap-1 px-2 pb-0.5">
			{#each view.filters as filter}
				{@const property = getProperty(filter.id)}
				{#if property}
					{#if property.type === PropertyType.CHECKBOX}
						{@const value = filter.values[0]}
						<Button
							theme="secondary"
							variant="compact"
							class="font-semibold"
							onclick={() => clearFilter(filter.id)}
						>
							{@render mockCheckbox(value === 'true')}
							<span> {property.name} </span>
							<X />
						</Button>
					{:else}
						{#each filter.values as fv}
							{@const option = getOption(property.options, fv)}
							{#if option}
								<Button
									theme="secondary"
									variant="compact"
									class="font-semibold"
									onclick={() => onClickFilterOption(filter.id, option.id, property.type)}
								>
									<span class={tm('size-3.5 rounded-sm', THEME_COLORS[option.color])}></span>
									<span>{option.value}</span>
									<X />
								</Button>
							{/if}
						{/each}
					{/if}
				{/if}
			{/each}

			<Button
				theme="secondary"
				variant="compact"
				class="font-semibold"
				onclick={() => clearAllFilter()}
			>
				Clear all
			</Button>
		</div>

		<HSeparator />
	{/if}
{/snippet}

{#snippet activeSorts()}
	{#if view.sorts.length > 0}
		<p class="w-full text-xs font-semibold px-2 py-0.5">Active</p>
		<div class="w-full space-y-0.5 px-0.5 pb-0.5">
			{#each view.sorts as sort}
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
{/snippet}

{#snippet clearBtn(id: string)}
	{#if hasFilterValues(id)}
		<HSeparator />
		<div class="w-full px-1 pb-1">
			<Button theme="ghost" class="h-8 w-full justify-start" onclick={() => clearFilter(id)}>
				<Eraser />
				Clear
			</Button>
		</div>
	{/if}
{/snippet}

{#snippet mockCheckbox(value: boolean)}
	<span class="p-[1px] rounded-sm bg-primary">
		{#if value}
			<Check class="size-3" />
		{:else}
			<Minus class="size-3" />
		{/if}
	</span>
{/snippet}

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
{#snippet empty(text: string)}
	<span class="text-base text-center font-semibold px-3 py-1">
		{text}
	</span>
{/snippet}
