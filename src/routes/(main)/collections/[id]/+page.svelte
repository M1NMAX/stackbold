<script lang="ts">
	import { CheckSquare2, ChevronLeft, Plus, Settings2, Square } from 'lucide-svelte';
	import { Color, View, type Property } from '@prisma/client';
	import {
		ItemNew,
		Items,
		getActiveItemState,
		groupItemsByPropertyValue,
		setItemState
	} from '$lib/components/items';
	import {
		getOption,
		getPropertyColor,
		getPropertyDefaultValue,
		getPropertyRef
	} from '$lib/components/property';
	import debounce from 'debounce';
	import { goto, preloadData, pushState } from '$app/navigation';
	import type { RouterInputs } from '$lib/trpc/router';
	import { tm, noCheck, sortFun, type SortOption } from '$lib/utils';
	import { Accordion, AccordionItem, Button, SlidingPanel } from '$lib/components/base/index.js';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { IconPicker, icons } from '$lib/components/icon';
	import { page } from '$app/state';
	import { getScreenSizeState } from '$lib/components/screen';
	import {
		DEBOUNCE_INTERVAL,
		DEFAULT_SORT_OPTIONS,
		ITEM_PANEL_CTX_KEY,
		MAX_COLLECTION_NAME_LENGTH,
		MAX_ITEM_NAME_LENGTH,
		PROPERTIES_PANEL_CTX_KEY,
		PROPERTY_COLORS
	} from '$lib/constant';
	import { CollectionMenu, getCollectionState } from '$lib/components/collection';
	import { setPropertyState } from '$lib/components/property';
	import { ModalState } from '$lib/states/index.js';
	import ItemPage from './item/[itemid]/+page.svelte';
	import PropertiesPage from './properties/+page.svelte';
	import { getContext } from 'svelte';
	import { clickOutside, textareaAutoSize } from '$lib/actions';
	import { getNameSchema } from '$lib/schema';
	import {
		FilterMenu,
		GroupByMenu,
		SearchInput,
		SortMenu,
		ViewButtons,
		getFilters
	} from '$lib/components/filters';
	import type { Filter } from '$lib/types';

	let { data } = $props();

	const collectionState = getCollectionState();

	let collection = $derived(getCurrentCollection());

	const itemState = setItemState(data.items);

	const propertyState = setPropertyState(getCurrentCollection().properties, data.cid);

	function getCurrentCollection() {
		return collectionState.collections.find((collection) => collection.id == data.cid)!;
	}

	$effect(() => {
		itemState.items = data.items;
		propertyState.collectionId = collection.id;

		propertyState.properties = collection.properties;
	});
	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<unknown>[])];

	const Icon = $derived(icons[collection.icon]);

	let view = $state<View>(View.LIST);

	let sort = $state(sortOptions[0]);

	let search = $state('');

	let filteredItems = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		const filters = getFilters(collection.filterConfigs, view);

		return [...itemState.items]
			.filter((item) => item.name.toLowerCase().includes(searchTerm))
			.filter((item) => {
				if (!filters) return true;
				if (filters.length === 0) return true;

				for (const filter of filters) {
					const ref = getPropertyRef(item.properties, filter.id);
					if (!ref) return false;
					if (!filter.values.includes(ref.value)) return false;
				}
				return true;
			})
			.sort(sortFun(sort.field, sort.order));
	});

	$effect(() => {
		data.cid;
		search = '';
	});

	let groupedItems = $derived.by(() => {
		return filteredItems.reduce(groupItemsByPropertyValue(findGroupByConfig(view) || ''), {});
	});

	let itemName = $state('');

	let itemNameError = $state<string | null>(null);
	let renameCollectionError = $state<string | null>(null);

	let isSmHeadingVisible = $state(false);
	let isCreateItemDialogOpen = $state(false);

	const isLargeScreen = getScreenSizeState();
	const activeItemState = getActiveItemState();

	async function updCollection(data: RouterInputs['collections']['update']['data']) {
		await collectionState.updCollection({ id: collection.id, data });
	}
	const updCollectionDebounced = debounce(updCollection, DEBOUNCE_INTERVAL);

	// collection input handlers
	async function handleOnInputCollectionName(e: Event) {
		const targetEl = e.target as HTMLInputElement;

		const parseResult = getNameSchema({
			label: 'Collection name',
			max: MAX_COLLECTION_NAME_LENGTH
		}).safeParse(targetEl.value);

		if (!parseResult.success) {
			renameCollectionError = parseResult.error.issues[0].message;
			return;
		}
		renameCollectionError = null;

		updCollectionDebounced({ name: targetEl.value });
	}

	async function handleOnInputCollectionDesc(e: Event) {
		const description = (e.target as HTMLTextAreaElement).value;

		updCollectionDebounced({ description });
	}

	// Item service functions
	async function handleCreateItem(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();

		const parseResult = getNameSchema({ label: 'Item name', max: MAX_ITEM_NAME_LENGTH }).safeParse(
			itemName
		);
		if (!parseResult.success) {
			itemNameError = parseResult.error.issues[0].message;
			return;
		}

		itemNameError = null;

		itemState.createItem({
			name: itemName,
			collectionId: collection.id,
			properties: propertyState.properties.map((prop) => ({
				id: prop.id,
				value: getPropertyDefaultValue(prop.type, prop.defaultValue)
			}))
		});
		itemName = '';
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}

	function includesGroupableProperties() {
		return propertyState.properties.some(({ type }) => type === 'SELECT' || type === 'CHECKBOX');
	}

	const VIEW_STORAGE_KEY = $derived(`collection-${collection.id}-view`);

	$effect(() => {
		const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
		if (savedView) view = JSON.parse(savedView);
	});

	$effect(() => {
		localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view));
	});

	const SORT_STORAGE_KEY = $derived(`collection-${collection.id}-sort`);
	$effect(() => {
		const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
		if (savedSort) sort = JSON.parse(savedSort);
	});

	$effect(() => {
		localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort));
	});

	function sortGroupedItems(a: string, b: string) {
		const propId = findGroupByConfig(view);
		const actualProp = propertyState.properties.find((prop) => prop.id === propId);
		if (actualProp == null || actualProp.type !== 'SELECT') return 0;

		const left = actualProp.options.findIndex((opt) => opt.id == a);
		const right = actualProp.options.findIndex((opt) => opt.id == b);

		if (left < right) return -1;
		if (left > right) return 1;

		return 0;
	}

	function findGroupByConfig(view: View) {
		const config = collection.groupByConfigs.find((config) => config.view === view);
		if (!config || config.propertyId === '') return null;
		return config.propertyId;
	}

	function updGroupByConfig(view: View, value: string) {
		return collection.groupByConfigs.map((config) => {
			if (config.view !== view) return config;
			return {
				view,
				propertyId: value
			};
		});
	}

	//Filters

	function updFilterConfig(filters: Filter[]) {
		if (collection.filterConfigs.length === 0) {
			const baseConfigs = [
				{
					view: View.LIST,
					filters: view === View.LIST ? filters : []
				},
				{
					view: View.TABLE,
					filters: view === View.TABLE ? filters : []
				}
			];
			updCollection({ filterConfigs: baseConfigs });
			return;
		}

		const filterConfigs = collection.filterConfigs.map((config) =>
			config.view !== view ? config : { ...config, filters }
		);
		updCollection({ filterConfigs });
	}

	//  Sliding panels
	const propertiesPanel = getContext<ModalState>(PROPERTIES_PANEL_CTX_KEY);

	async function onClickOpenProperties() {
		const url = `/collections/${collection.id}/properties`;
		if (!isLargeScreen.current) {
			goto(url);
			return;
		}

		const result = await preloadData(url);

		if (result.type === 'loaded' && result.status === 200) {
			pushState(url, { showPanel: true, insidePanel: true });
			propertiesPanel.open();
		} else {
			goto(url);
		}
	}

	const itemPanel = getContext<ModalState>(ITEM_PANEL_CTX_KEY);

	async function clickItem(id: string) {
		activeItemState.update(id);
		const url = `/collections/${collection.id}/item/${id}`;
		if (!isLargeScreen.current) {
			goto(url);
			return;
		}

		const result = await preloadData(url);

		if (result.type === 'loaded' && result.status === 200) {
			pushState(url, { id: result.data.id, insidePanel: true });
			itemPanel.open();
		} else {
			goto(url);
		}
	}
</script>

<svelte:head>
	<title>{collection.name} - Stackbold</title>
</svelte:head>

<PageContainer
	class={tm(
		'ease-in-out duration-300',
		itemPanel.isOpen || propertiesPanel.isOpen ? 'w-0 md:w-1/2' : 'w-full md:5/6'
	)}
>
	<PageHeader
		class={tm('flex', isSmHeadingVisible ? 'justify-between' : 'justify-between md:justify-end')}
	>
		<Button theme="secondary" variant="icon" class="md:hidden" onclick={() => history.back()}>
			<ChevronLeft />
		</Button>
		<div class={tm('grow flex items-center space-x-2', !isSmHeadingVisible && 'hidden')}>
			<Icon class="icon-md" />
			<h1 class="grow font-semibold text-xl text-nowrap">
				{collection.name.length > 18 && !isLargeScreen.current
					? collection.name.substring(0, 18) + '...'
					: collection.name}
			</h1>
		</div>
		<div class="flex justify-end items-center space-x-1.5">
			<Button theme="secondary" variant="icon" onclick={() => onClickOpenProperties()}>
				<Settings2 />
			</Button>

			<CollectionMenu {collection} />
		</div>
	</PageHeader>

	<PageContent class="relative lg:pt-1" onScroll={handleScroll}>
		<div class=" flex items-center space-x-2">
			<IconPicker name={collection.icon} onIconChange={(icon) => updCollection({ icon })} />

			<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
			<input
				role="heading"
				aria-level="1"
				value={collection.name}
				type="text"
				maxlength={MAX_COLLECTION_NAME_LENGTH}
				oninput={handleOnInputCollectionName}
				class="grow font-semibold text-2xl md:text-3xl focus:outline-none bg-transparent"
			/>
		</div>
		{#if renameCollectionError}
			<span class="text-primary"> {renameCollectionError}</span>
		{/if}
		{#if !collection.isDescHidden}
			<label for="description" class="sr-only"> Collection description </label>

			<textarea
				use:textareaAutoSize
				id="description"
				value={collection.description}
				oninput={handleOnInputCollectionDesc}
				spellcheck={false}
				class="textarea textarea-ghost"
			></textarea>
		{/if}

		<!-- upper navigation handler -->
		<div class="sticky -top-1 z-10 hidden md:flex justify-between space-x-2 pb-1.5 bg-card">
			<SearchInput placeholder="Find Item" bind:value={search} />

			<SortMenu options={sortOptions} bind:value={sort} />

			<!-- Only show groupby btn if collection properties includes a 'SELECT' or 'CHECKBOX' -->
			{#if includesGroupableProperties()}
				<FilterMenu
					filters={getFilters(collection.filterConfigs, view)}
					updFilters={updFilterConfig}
				/>
				<GroupByMenu
					value={findGroupByConfig(view) || 'none'}
					updValue={(value) => updCollection({ groupByConfigs: updGroupByConfig(view, value) })}
				/>
			{/if}

			<ViewButtons options={[View.LIST, View.TABLE]} bind:value={view} />

			<Button onclick={() => (isCreateItemDialogOpen = true)}>New item</Button>
		</div>
		<div class="flex flex-col md:hidden space-y-1">
			<SearchInput placeholder="Find Item" bind:value={search} />

			<div class="flex items-center justify-between space-x-1">
				<div class="flex items-center gap-x-1">
					<SortMenu options={sortOptions} bind:value={sort} />

					{#if includesGroupableProperties()}
						<FilterMenu
							filters={getFilters(collection.filterConfigs, view)}
							updFilters={updFilterConfig}
						/>
						<GroupByMenu
							value={findGroupByConfig(view) || 'none'}
							updValue={(value) => updCollection({ groupByConfigs: updGroupByConfig(view, value) })}
						/>
					{/if}
				</div>

				<ViewButtons options={[View.LIST, View.TABLE]} bind:value={view} />
			</div>
		</div>
		{#if !findGroupByConfig(view)}
			<Items items={filteredItems} {view} clickOpenItem={(id) => clickItem(id)} />
		{:else}
			<Accordion
				type="multiple"
				value={Object.keys(groupedItems).map((k) => `accordion-item-${k}`)}
			>
				{#each Object.keys(groupedItems).sort(sortGroupedItems) as key (`group-item-${key}`)}
					{@const property = propertyState.getProperty(groupedItems[key].pid)}

					{#if property}
						{@const color = getPropertyColor(property, key)}
						<AccordionItem id={`accordion-item-${key}`}>
							{#snippet header()}
								{@render groupLabel(key, property, color)}
							{/snippet}
							<Items items={groupedItems[key].items} {view} clickOpenItem={(id) => clickItem(id)} />
						</AccordionItem>
					{/if}
				{/each}
			</Accordion>
		{/if}
		{#if isLargeScreen.current}
			<div class="sticky inset-x-0 bottom-0">
				{#if itemNameError}
					<span
						use:clickOutside
						onclickoutside={() => (itemNameError = null)}
						class="w-full text-error"
					>
						{itemNameError}
					</span>
				{/if}
				<form onsubmit={handleCreateItem} class="relative">
					<label for="item-name" class="sr-only"> Name</label>
					<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
						<Plus class="text-primary" />
					</div>
					<input
						bind:value={itemName}
						id="item-name"
						name="name"
						placeholder="New item"
						autocomplete="off"
						class="h-10 w-full pl-10 text-base font-semibold rounded-sm bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
					/>
				</form>
			</div>
		{:else}
			<Button
				variant="icon"
				class="fixed bottom-4 right-3 z-10 h-12 w-12 rounded-sm"
				onclick={() => (isCreateItemDialogOpen = true)}
			>
				<Plus />
			</Button>
		{/if}
	</PageContent>
</PageContainer>

{#if page.state.id}
	<!-- Item sliding-panel -->
	<SlidingPanel open={itemPanel.isOpen} class="w-full md:w-2/6">
		<ItemPage data={noCheck(page.state)} />
	</SlidingPanel>
{/if}
{#if page.state.showPanel}
	<!-- Properties Sliding panel -->
	<SlidingPanel open={propertiesPanel.isOpen} class="w-full md:w-2/6 ">
		<PropertiesPage data={noCheck(page.state)} />
	</SlidingPanel>
{/if}
<ItemNew bind:isOpen={isCreateItemDialogOpen}>
	<form onsubmit={handleCreateItem} class="flex flex-col space-y-2">
		<label for="item-name" class="sr-only"> Name</label>

		<input
			bind:value={itemName}
			id="item-name"
			placeholder="New item"
			name="name"
			autocomplete="off"
			class="input"
			type="text"
			maxlength={MAX_ITEM_NAME_LENGTH}
		/>

		<Button type="submit" class="w-full">Create</Button>
	</form>
</ItemNew>

{#snippet groupLabel(key: string, property: Property, color: Color)}
	<span
		class={tm('h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold', PROPERTY_COLORS[color])}
	>
		{#if property.type === 'SELECT'}
			{@const option = getOption(property.options, key)}
			{option ? option.value : `No ${property.name}`}
		{:else if property.type === 'CHECKBOX'}
			{#if key === 'true'}
				<CheckSquare2 class="icon-xs mr-1.5" />
			{:else}
				<Square class="icon-xs mr-1.5" />
			{/if}

			{property.name}
		{/if}
	</span>
{/snippet}
