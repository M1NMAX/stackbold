<script lang="ts">
	import CheckSquare2 from 'lucide-svelte/icons/check-square-2';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Plus from 'lucide-svelte/icons/plus';
	import Settings2 from 'lucide-svelte/icons/settings-2';
	import Square from 'lucide-svelte/icons/square';
	import { Color, View, type Property } from '@prisma/client';
	import {
		Items,
		getActiveItemState,
		groupItemsByPropertyValue,
		setItemState
	} from '$lib/components/items/index.js';
	import {
		getOption,
		getPropertyColor,
		getPropertyDefaultValue,
		getPropertyRef
	} from '$lib/components/property/index.js';
	import debounce from 'debounce';
	import { goto, preloadData, pushState } from '$app/navigation';
	import type { RouterInputs } from '$lib/trpc/router';
	import { tm, noCheck, sortFun, type SortOption } from '$lib/utils/index.js';
	import {
		Accordion,
		AccordionItem,
		Button,
		IconPicker,
		Shortcut,
		Tooltip
	} from '$lib/components/base/index.js';
	import {
		PageContainer,
		PageContent,
		PageFooter,
		PageHeader
	} from '$lib/components/page/index.js';
	import { page } from '$app/state';
	import {
		COLLECTION_ICONS,
		COLLECTION_PAGE_PANEL_CTX_KEY,
		DEBOUNCE_INTERVAL,
		DEFAULT_SORT_OPTIONS,
		MAX_COLLECTION_NAME_LENGTH,
		MAX_ITEM_NAME_LENGTH,
		PROPERTY_COLORS,
		SCREEN_MD_MEDIA_QUERY
	} from '$lib/constant/index.js';
	import { CollectionMenu, getCollectionState } from '$lib/components/collection/index.js';
	import { setPropertyState } from '$lib/components/property';
	import { ModalState } from '$lib/states/index.js';
	import ItemPage from './item/[itemid=id]/+page.svelte';
	import PropertiesPage from './properties/+page.svelte';
	import { getContext, tick } from 'svelte';
	import { clickOutside, escapeKeydown, textareaAutoSize } from '$lib/actions/index.js';
	import { getNameSchema } from '$lib/schema';
	import {
		FilterMenu,
		GroupByMenu,
		SearchInput,
		SortMenu,
		ViewButtons,
		getFilters
	} from '$lib/components/filters/index.js';
	import type { Filter } from '$lib/types';
	import { MediaQuery } from 'svelte/reactivity';

	let { data } = $props();

	const collectionState = getCollectionState();

	let collection = $derived(getCurrentCollection());

	const itemState = setItemState(data.items);
	const propertyState = setPropertyState(data.properties);

	function getCurrentCollection() {
		return collectionState.collections.find((collection) => collection.id == data.cid)!;
	}

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<unknown>[])];

	const Icon = $derived(COLLECTION_ICONS[collection.icon]);

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
		itemState.items = data.items;
		propertyState.properties = data.properties;
		propertyState.collectionId = data.cid;
	});

	let groupedItems = $derived.by(() => {
		return filteredItems.reduce(groupItemsByPropertyValue(findGroupByConfig(view) || ''), {});
	});

	let itemName = $state('');

	let itemNameError = $state<string | null>(null);
	let renameCollectionError = $state<string | null>(null);

	let isSmHeadingVisible = $state(false);
	let isNewItemInputVisible = $state(false);

	type PanelContentType = 'view-item' | 'view-properties' | null;

	let panelContentType = $state<PanelContentType>(null);
	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);

	const isLargeScreen = new MediaQuery(SCREEN_MD_MEDIA_QUERY, false);
	const activeItemState = getActiveItemState();

	async function updCollection(args: Omit<RouterInputs['collections']['update'], 'id'>) {
		await collectionState.updCollection({ ...args, id: collection.id });
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

		const parseResult = getNameSchema({
			label: 'Item name',
			max: MAX_ITEM_NAME_LENGTH
		}).safeParse(itemName);

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
				value: getPropertyDefaultValue(prop)
			}))
		});
		itemName = '';
	}

	$effect(() => {
		if (isNewItemInputVisible) {
			const inputEl = document.getElementById('new-item-name') as HTMLInputElement;
			tick().then(() => inputEl.focus());
		}
	});

	$effect(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.altKey && e.key === 'n') {
				e.preventDefault();
				isNewItemInputVisible = true;
			} else if (e.ctrlKey && e.altKey && e.key === 'm') {
				e.preventDefault();
				onClickCreateItemAdvance();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

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
		const groupByConfigs = collection.groupByConfigs.map((config) => {
			if (config.view !== view) return config;
			return {
				view,
				propertyId: value
			};
		});

		updCollection({ groupByConfigs });
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

	// Sliding panel
	async function onClickOpenProperties() {
		if (panelState.isOpen) history.back();

		const url = `/collections/${collection.id}/properties`;
		if (!isLargeScreen.current) {
			goto(url);
			return;
		}

		const result = await preloadData(url);
		if (result.type === 'loaded' && result.status === 200) {
			pushState(url, { insidePanel: true });
			panelContentType = 'view-properties';
			if (!panelState.isOpen) panelState.open();
		} else {
			goto(url);
		}
	}

	async function clickItem(id: string) {
		if (panelState.isOpen) history.back();

		activeItemState.update(id);
		const url = `/collections/${collection.id}/item/${id}`;
		if (!isLargeScreen.current) {
			goto(url);
			return;
		}

		const result = await preloadData(url);
		if (result.type === 'loaded' && result.status === 200) {
			pushState(url, { id: result.data.id, insidePanel: true });
			panelContentType = 'view-item';
			if (!panelState.isOpen) panelState.open();
		} else {
			goto(url);
		}
	}

	async function onClickCreateItemAdvance() {
		const id = await itemState.createItem({
			name: '',
			collectionId: collection.id,
			properties: propertyState.properties.map((prop) => ({
				id: prop.id,
				value: getPropertyDefaultValue(prop)
			}))
		});
		if (!id) return;
		await clickItem(id);
	}
</script>

<svelte:head>
	<title>{collection.name} - Stackbold</title>
</svelte:head>

<PageContainer class={tm(panelState.isOpen && 'w-0 md:w-1/2')}>
	<PageHeader
		class={tm('flex', isSmHeadingVisible ? 'justify-between' : 'justify-between md:justify-end')}
	>
		<Button theme="secondary" variant="icon" class="md:hidden" onclick={() => history.back()}>
			<ChevronLeft />
		</Button>
		<div class={tm('grow flex items-center space-x-2', !isSmHeadingVisible && 'hidden')}>
			<Icon class="size-6" />
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

	<PageContent class="relative lg:pt-1" onscroll={handleScroll}>
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
					updValue={(value) => updGroupByConfig(view, value)}
				/>
			{/if}

			<ViewButtons options={[View.LIST, View.TABLE]} bind:value={view} />
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
							updValue={(value) => updGroupByConfig(view, value)}
						/>
					{/if}
				</div>

				<ViewButtons options={[View.LIST, View.TABLE]} bind:value={view} />
			</div>
		</div>
		{#if !findGroupByConfig(view)}
			<Items items={filteredItems} {view} clickOpenItem={(id) => clickItem(id)} />
		{:else}
			<Accordion isMulti value={Object.keys(groupedItems).map((k) => `accordion-item-${k}`)}>
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
	</PageContent>
	<PageFooter class="w-full flex gap-x-0.5">
		<Tooltip triggerBy="createItemAdvanceBtn" align="start">
			<div class="flex items-center p-1 gap-x-2">
				<span class="text-sm font-semibold">Create item advanced</span>
				<Shortcut>
					<span> Ctrl </span>
					<span> Alt </span>
					<span> M </span>
				</Shortcut>
			</div>
		</Tooltip>
		<Button
			id="createItemAdvanceBtn"
			theme="secondary"
			variant="icon"
			class="[&_svg]:text-primary [&_svg]:size-5"
			onclick={onClickCreateItemAdvance}
		>
			<Plus />
		</Button>
		{#if isNewItemInputVisible}
			<form onsubmit={handleCreateItem} class="grow relative">
				<label for="new-item-name" class="sr-only"> Item name</label>
				<input
					bind:value={itemName}
					use:escapeKeydown
					id="new-item-name"
					name="new-item-name"
					placeholder="New item"
					autocomplete="off"
					class="h-9 w-full px-2 text-base font-semibold rounded-sm bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
					onfocusout={() => (isNewItemInputVisible = false)}
					onescapekey={() => (isNewItemInputVisible = false)}
				/>
			</form>
		{:else}
			<Button
				theme="secondary"
				class="grow flex justify-between items-center"
				onclick={() => (isNewItemInputVisible = true)}
			>
				<span class="text-base font-semibold text-primary"> New item </span>

				<Shortcut>
					<span>Alt</span>
					<span>N</span>
				</Shortcut>
			</Button>
		{/if}
	</PageFooter>
</PageContainer>

<!-- Sliding panel -->
<aside
	class={tm(
		'h-full flex flex-col space-y-2 p-0 overflow-hidden',
		'rounded-md bg-card text-card-foreground transition-all duration-300',
		panelState.isOpen ? 'w-full md:w-2/6 ml-1.5' : 'w-0'
	)}
>
	{#if panelContentType === 'view-item' && page.state.id}
		<ItemPage data={noCheck(page.state)} />
	{:else if panelContentType === 'view-properties'}
		<PropertiesPage data={noCheck(page.state)} />
	{/if}
</aside>

{#snippet groupLabel(key: string, property: Property, color: Color)}
	<span
		class={tm('h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold', PROPERTY_COLORS[color])}
	>
		{#if property.type === 'SELECT'}
			{@const option = getOption(property.options, key)}
			{option ? option.value : `No ${property.name}`}
		{:else if property.type === 'CHECKBOX'}
			{#if key === 'true'}
				<CheckSquare2 class="size-4 mr-1.5" />
			{:else}
				<Square class="size-4 mr-1.5 " />
			{/if}

			{property.name}
		{/if}
	</span>
{/snippet}
