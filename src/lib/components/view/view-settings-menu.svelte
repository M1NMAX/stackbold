<script lang="ts">
	import ArrowDownUp from 'lucide-svelte/icons/arrow-down-up';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Settings from 'lucide-svelte/icons/settings-2';
	import ListCollapse from 'lucide-svelte/icons/list-collapse';
	import ListFilter from 'lucide-svelte/icons/list-filter';
	import MoveDown from 'lucide-svelte/icons/move-down';
	import MoveUp from 'lucide-svelte/icons/move-up';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import X from 'lucide-svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		HSeparator,
		Label,
		MenuTitle,
		RadioGroup,
		RadioGroupItem,
		Switch,
		Tooltip
	} from '$lib/components/base/index.js';
	import { PropertyType, SortType, type Sort, type View } from '@prisma/client';
	import {
		getPropertyState,
		isPropertyVisible,
		PropertyIcon
	} from '$lib/components/property/index.js';
	import { getViewState } from './index.js';
	import { capitalizeFirstLetter, useId } from '$lib/utils/index.js';
	import { FILTERABLE_PROPERTY_TYPES, NAME_FIELD, VALUE_NONE } from '$lib/constant/index.js';
	import type { Nullable } from '$lib/types.js';
	import { getItemState } from '$lib/components/items/index.js';

	type Props = {
		view: View;
	};

	type ContentType = Nullable<'filter' | 'sort' | 'group' | 'visibility'>;

	let { view }: Props = $props();
	let content = $state<ContentType>(null);

	const id = useId();
	const menuState = new ModalState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const itemState = getItemState();

	const properties = $derived.by(getFilterableProperties);

	function getFilterableProperties() {
		return propertyState.properties.filter((prop) => FILTERABLE_PROPERTY_TYPES.includes(prop.type));
	}

	async function togglePropertyVisibility(pid: string) {
		const properties = view.properties.map((p) =>
			p.id !== pid ? p : { ...p, isVisible: !p.isVisible }
		);
		await viewState.updView({ id: view.id, properties });
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

<Tooltip triggerBy={id} align="end">
	<span class="text-sm font-semibold py-1 px-1.5">Settings</span>
</Tooltip>
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
			<span> Property Visibility </span>
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
	{:else if content === 'sort'}
		{@render header('Sort by')}
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
	{/if}
</AdaptiveWrapper>

{#snippet header(title: string)}
	<div class="w-full flex items-center gap-x-0.5 px-1 pt-1">
		<Button theme="ghost" variant="compact" onclick={() => (content = null)}>
			<ChevronLeft />
		</Button>
		<span class="pl-0.5 pr-2.5 py-1 font-semibold text-sm">
			{title}
		</span>
	</div>
	<HSeparator />
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
