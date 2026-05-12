<script lang="ts">
	import type { Icon } from 'lucide-svelte';
	import ArrowDownUp from 'lucide-svelte/icons/arrow-down-up';
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import ArrowUp from 'lucide-svelte/icons/arrow-up';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Eraser from 'lucide-svelte/icons/eraser';
	import ListCollapse from 'lucide-svelte/icons/list-collapse';
	import ListFilter from 'lucide-svelte/icons/list-filter';
	import Settings from 'lucide-svelte/icons/settings-2';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import X from 'lucide-svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import {
		AdaptiveWrapper,
		Badge,
		Button,
		buttonVariants,
		Checkbox,
		HSeparator,
		Label,
		MenuTitle,
		MockCheckbox,
		RadioGroup,
		RadioGroupItem,
		Switch,
		Tooltip
	} from '$lib/components/base/index.js';
	import {
		PropertyType,
		SortType,
		ViewType,
		type Filter,
		type Sort,
		type View
	} from '@prisma/client';
	import { getPropertyState, PropertyIcon } from '$lib/components/property/index.js';
	import { getViewState, isFilterSeletect, toggleFilter } from './index.js';
	import {
		capitalizeFirstLetter,
		getOption,
		isPropertyVisible,
		tm,
		useId
	} from '$lib/utils/index.js';
	import {
		FILTERABLE_PROPERTY_TYPES,
		GROUPABLE_PROPERTY_TYPES,
		NAME_FIELD,
		THEME_COLORS,
		VALUE_NONE
	} from '$lib/constant/index.js';
	import type { Nullable } from '$lib/types.js';
	import { getItemState } from '$lib/components/item/index.js';

	type Props = {
		view: View;
	};

	const CONTENT_OPTIONS = {
		FILTER: 'FILTER',
		FILTER_PROPERTY: 'FILTER_PROPERTY',
		SORT: 'SORT',
		GROUP: 'GROUP',
		VISIBILITY: 'VISIBILITY'
	} as const;

	type ContentType = Nullable<(typeof CONTENT_OPTIONS)[keyof typeof CONTENT_OPTIONS]>;
	type MenuItem = {
		label: string;
		value: ContentType;
		icon: typeof Icon;
	};

	let { view }: Props = $props();

	const MENU_ITEMS: MenuItem[] = [
		{ label: 'Property visibility', value: CONTENT_OPTIONS.VISIBILITY, icon: ToggleRight },
		{ label: 'Filter', value: CONTENT_OPTIONS.FILTER, icon: ListFilter },
		{ label: 'Sort', value: CONTENT_OPTIONS.SORT, icon: ArrowDownUp },
		{ label: 'Group', value: CONTENT_OPTIONS.GROUP, icon: ListCollapse }
	];

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
		await viewState.updView({ id: view.id, groupBy: value ?? null });
	}

	async function toggleViewHideEmptyGroups() {
		await viewState.updView({
			id: view.id,
			hideEmptyGroups: view.hideEmptyGroups ? !view.hideEmptyGroups : true
		});
	}

	async function toggleViewHideItemCounts() {
		await viewState.updView({
			id: view.id,
			hideItemCounts: view.hideItemCounts ? !view.hideItemCounts : true
		});
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

<Tooltip triggerBy={id} align="end">Settings</Tooltip>
<AdaptiveWrapper
	{id}
	bind:open={menuState.isOpen}
	floatingAlign="end"
	triggerClass={buttonVariants({
		theme: menuState.isOpen ? 'secondary' : 'ghost',
		variant: 'icon'
	})}
>
	{#snippet trigger()}
		<Settings />
	{/snippet}
	{#if !content}
		<MenuTitle title="View settings" />

		{#each MENU_ITEMS as item (item.value)}
			<Button theme="ghost" variant="menu" onclick={() => (content = item.value)}>
				<item.icon />
				<span> {item.label} </span>
			</Button>
		{/each}
	{:else if content === CONTENT_OPTIONS.VISIBILITY}
		{@render header('Properties')}
		{#each propertyState.properties as property}
			<Label for={property.id} compact hoverEffect>
				<PropertyIcon key={property.type} />
				<span> {property.name} </span>
				<Switch
					id={property.id}
					checked={isPropertyVisible(view, property.id)}
					onchange={() => togglePropertyVisibility(property.id)}
				/>
			</Label>
		{/each}
	{:else if content === CONTENT_OPTIONS.FILTER}
		{@render header('Filters')}
		{@render activeFilters()}

		{#each properties as property}
			<Button
				theme="ghost"
				variant="menu"
				onclick={() => {
					filterSelectedProperty = property;
					content = CONTENT_OPTIONS.FILTER_PROPERTY;
				}}
			>
				<PropertyIcon key={property.type} />
				{property.name}
			</Button>
		{:else}
			{@render empty('Existing properties do not support filters')}
		{/each}
	{:else if content === CONTENT_OPTIONS.FILTER_PROPERTY}
		{@render header(`${filterSelectedProperty.name} is`, CONTENT_OPTIONS.FILTER)}
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
							<MockCheckbox checked={value} />
							<span> {value ? 'Checked' : 'Unchecked'} </span>
							<RadioGroupItem id={filterMenuCheckboxId} value={value.toString()}></RadioGroupItem>
						</Label>
					{/each}
				</RadioGroup>
			{/key}
		{:else}
			<div class="space-y-0.5">
				{#each filterSelectedProperty.options as option}
					<Checkbox
						checked={isFilterSeletect(view.filters, {
							id: filterSelectedProperty.id,
							value: option.id
						})}
						onclick={() => {
							onClickFilterOption(
								filterSelectedProperty.id,
								option.id,
								filterSelectedProperty.type
							);
						}}
					>
						<Badge color={option.color}>{option.value}</Badge>
					</Checkbox>
				{/each}
			</div>
		{/if}
		{@render clearBtn(filterSelectedProperty.id)}
	{:else if content === CONTENT_OPTIONS.SORT}
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
					<PropertyIcon key={property.type} />
					{property.name}
				</Button>
			{/if}
		{/each}
	{:else if content === CONTENT_OPTIONS.GROUP}
		{@const groupableProperties = propertyState.properties.filter((p) =>
			GROUPABLE_PROPERTY_TYPES.includes(p.type)
		)}

		{@render header('Group By')}

		{#if groupableProperties.length > 0}
			<RadioGroup value={view.groupBy ?? ''} onchange={updViewGroupBy}>
				{#if view.type !== ViewType.BOARD}
					<Label for="collection-group-by-none" compact hoverEffect>
						<PropertyIcon key="none" />
						<span>{VALUE_NONE}</span>
						<RadioGroupItem id="collection-group-by-none" value="" />
					</Label>
				{/if}

				{#each groupableProperties as property (property.id)}
					{@const id = useId(`group-by-${property.id}`)}
					<Label for={id} compact hoverEffect>
						<PropertyIcon key={property.type} />
						<span> {property.name} </span>
						<RadioGroupItem {id} value={property.id} />
					</Label>
				{/each}
			</RadioGroup>
			<HSeparator />
			<Label for={`view-${view.id}-hide-empty`} compact hoverEffect>
				<span>Hide empty groups</span>
				<Switch
					id={`view-${view.id}-hide-empty`}
					checked={view.hideEmptyGroups ?? false}
					onchange={() => toggleViewHideEmptyGroups()}
				/>
			</Label>

			<Label for={`view-${view.id}-hide-count`} compact hoverEffect>
				<span>Hide items count</span>
				<Switch
					id={`view-${view.id}-hide-count`}
					checked={view.hideItemCounts ?? false}
					onchange={() => toggleViewHideItemCounts()}
				/>
			</Label>
		{:else}
			{@render empty('Existing properties do not support grouping')}
		{/if}
	{/if}
</AdaptiveWrapper>

{#snippet header(title: string, backTo: ContentType = null)}
	<div class="w-full flex items-center gap-x-1 px-0.5">
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
		<p class="w-full text-xs font-semibold px-1 py-0.5">Active filters</p>
		<div class="w-full flex flex-wrap gap-1 px-1 pb-0.5">
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
							<MockCheckbox checked={value === 'true'} />
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
									class={tm('px-1 font-semibold', THEME_COLORS[option.color])}
									onclick={() => onClickFilterOption(filter.id, option.id, property.type)}
								>
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
				Clear
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
		<Button theme="ghost" variant="menu" onclick={() => clearFilter(id)}>
			<Eraser />
			Clear
		</Button>
	{/if}
{/snippet}

{#snippet activeSortRow(sort: Sort, name: string, key: PropertyType)}
	{@const Icon = sort.order === SortType.ASC ? ArrowUp : ArrowDown}
	<div class="flex items-center justify-between gap-x-0.5 px-1 font-semibold">
		<span class="grow flex items-center gap-2 lg:gap-1.5">
			<PropertyIcon {key} />
			<span class="text-base lg:text-sm font-medium">
				{name}
			</span>
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
