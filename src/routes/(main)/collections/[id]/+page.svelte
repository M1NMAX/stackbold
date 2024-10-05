<script lang="ts">
	import {
		CheckSquare2,
		Pin,
		PinOff,
		Plus,
		Settings2,
		Square,
		SquareSlash,
		StretchHorizontal,
		Table
	} from 'lucide-svelte';
	import { Color, View, type Property } from '@prisma/client';
	import {
		ItemNew,
		Items,
		groupItemsByPropertyValue,
		setActiveItemState,
		setItemState
	} from '$lib/components/items';
	import {
		PropertyIcon,
		containsView,
		//helpers
		getOption,
		getPropertyColor,
		getPropertyDefaultValue,
		toggleView
	} from '$lib/components/property';
	import debounce from 'debounce';
	import { goto, preloadData, pushState } from '$app/navigation';
	import type { RouterInputs } from '$lib/trpc/router';
	import {
		capitalizeFirstLetter,
		cn,
		noCheck,
		preventEnterKeypress,
		sortFun,
		type SortOption
	} from '$lib/utils';
	import { fade } from 'svelte/transition';
	import dayjs from '$lib/utils/dayjs';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { SlidingPanel } from '$lib/components/sliding-panel';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { IconPicker, icons } from '$lib/components/icon';
	import { page } from '$app/stores';
	import { SearchInput } from '$lib/components/search';
	import { SortDropdown } from '$lib/components/sort';
	import { ViewButtonsGroup, getScreenState } from '$lib/components/view';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import {
		DEBOUNCE_INTERVAL,
		DEFAULT_SORT_OPTIONS,
		ITEM_PANEL_CTX_KEY,
		PROPERTIES_PANEL_CTX_KEY,
		PROPERTY_COLORS
	} from '$lib/constant';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { CollectionMenu, getCollectionState } from '$lib/components/collection';
	import { getGroupState } from '$lib/components/group';
	import { setPropertyState } from '$lib/components/property';
	import { ModalState } from '$lib/components/modal';
	import ItemPage from './item/[itemid]/+page.svelte';
	import PropertiesPage from './properties/+page.svelte';
	import { getContext } from 'svelte';
	import { clickOutside, textareaAutoSize } from '$lib/actions';
	import { nameSchema } from '$lib/schema';

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

	let sort = $state(sortOptions[0]);

	let search = $state('');
	let filteredItems = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return [...itemState.items]
			.filter((item) => item.name.toLowerCase().includes(searchTerm))
			.sort(sortFun(sort.field, sort.order));
	});

	const Icon = $derived(icons[collection.icon]);

	let view = $state<View>(View.LIST);
	let groupedItems = $derived.by(() => {
		return filteredItems.reduce(groupItemsByPropertyValue(findGroupByConfig(view) || ''), {});
	});

	let itemName = $state('');

	let itemNameError = $state<string | null>(null);
	let renameCollectionError = $state<string | null>(null);

	let isSmallHeadingVisible = $state(false);
	let isCreateItemDialogOpen = $state(false);

	const groupState = getGroupState();
	const isDesktop = getScreenState();
	const activeItemState = setActiveItemState();

	async function updCollection(data: RouterInputs['collections']['update']['data']) {
		await collectionState.updCollection({ id: collection.id, data });
	}
	const updCollectionDebounced = debounce(updCollection, DEBOUNCE_INTERVAL);

	// collection input handlers
	async function handleOnInputCollectionName(e: {
		currentTarget: EventTarget & HTMLHeadingElement;
	}) {
		const targetEl = e.currentTarget;
		const name = targetEl.innerText;

		if (name.length > 50) {
			renameCollectionError = 'Collection name must be at most 50 characters long';
			return;
		}
		renameCollectionError = null;

		updCollectionDebounced({ name });
	}

	async function handleOnInputCollectionDesc(e: Event) {
		const description = (e.target as HTMLTextAreaElement).value;

		updCollectionDebounced({ description });
	}

	// Item service functions
	async function handleCreateItem(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();

		const parseResult = nameSchema.safeParse(itemName);
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

	// Property Handlers
	function getProperty(pid: string) {
		return propertyState.properties.find((property) => property.id === pid) || null;
	}

	const updPropertyDebounced = debounce(updProperty, DEBOUNCE_INTERVAL);
	async function updProperty(property: RouterInputs['collections']['updateProperty']['property']) {
		await propertyState.updProperty(property);
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmallHeadingVisible = true;
		else isSmallHeadingVisible = false;
	}

	function includesGroupableProperties() {
		return propertyState.properties.some(({ type }) => type === 'SELECT' || type === 'CHECKBOX');
	}

	const VIEW_STORAGE_KEY = $derived(`collection-${collection.id}-view`);

	$effect(() => {
		const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
		if (savedView) sort = JSON.parse(savedView);
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

	//  Sliding panels
	const propertiesPanel = getContext<ModalState>(PROPERTIES_PANEL_CTX_KEY);

	async function onClickOpenProperties() {
		const url = `/collections/${collection.id}/properties`;
		if (!$isDesktop) {
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
		activeItemState.id = id;
		const url = `/collections/${collection.id}/item/${id}`;
		if (!$isDesktop) {
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
	class={cn(
		'flex flex-col space-y-1 ease-in-out duration-300',
		(itemPanel.isOpen || propertiesPanel.isOpen) && 'w-2/3'
	)}
>
	<PageHeader>
		<div
			class={cn(
				'w-full flex justify-between items-center',
				!isSmallHeadingVisible && 'justify-end'
			)}
		>
			<div
				class={cn('flex justify-center items-center space-x-2', !isSmallHeadingVisible && 'hidden')}
			>
				<Icon class="icon-md" />
				<h1 class="grow font-semibold text-xl text-nowrap">
					{collection.name.length > 18 && !$isDesktop
						? collection.name.substring(0, 18) + '...'
						: collection.name}
				</h1>
			</div>
			<div class="flex justify-end items-center space-x-1.5">
				<span class="hidden lg:block font-semibold text-xs text-gray-500 mr-2">
					Updated
					{dayjs(collection.updatedAt).fromNow()}
				</span>

				<Button
					variant="secondary"
					size="icon"
					on:click={() => updCollection({ isPinned: !collection.isPinned })}
				>
					{#if collection.isPinned}
						<PinOff />
					{:else}
						<Pin />
					{/if}
				</Button>

				<Button variant="secondary" size="icon" on:click={() => onClickOpenProperties()}>
					<Settings2 />
				</Button>

				<CollectionMenu {collection} />
			</div>
		</div>
	</PageHeader>

	<PageContent class="relative lg:pt-1 lg:pb-12 lg:px-4" onScroll={handleScroll}>
		<div class=" flex items-center space-x-2">
			<IconPicker name={collection.icon} onIconChange={(icon) => updCollection({ icon })} />

			<h1
				class="grow font-semibold text-2xl md:text-3xl focus:outline-none"
				contenteditable
				spellcheck={false}
				onkeypress={preventEnterKeypress}
				oninput={handleOnInputCollectionName}
			>
				{collection.name}
			</h1>
		</div>
		{#if renameCollectionError}
			<span class="text-primary"> {renameCollectionError}</span>
		{/if}
		{#key collection.id}
			{#if !collection.isDescHidden}
				<label transition:fade for="description" class="sr-only"> Collection description </label>
				<!-- TODO: CHANGE URG -->

				<textarea
					use:textareaAutoSize
					id="description"
					value={collection.description}
					oninput={handleOnInputCollectionDesc}
					spellcheck={false}
					class="textarea textarea-ghost"
				></textarea>
			{/if}
		{/key}

		{#if $isDesktop}
			<!-- upper navigation handler -->
			<div class="sticky -top-1 z-10 flex justify-between space-x-2 bg-card">
				<SearchInput placeholder="Find Item" bind:value={search} />

				<!-- Only show groupby btn if collection properties includes a 'SELECT' or 'CHECKBOX' -->
				{#key propertyState.properties}
					{#if includesGroupableProperties()}
						<div>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild let:builder>
									<Button variant="secondary" builders={[builder]} class="w-full">Group by</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content class="w-56">
									<DropdownMenu.Label>Group by</DropdownMenu.Label>
									<DropdownMenu.Separator />
									<DropdownMenu.RadioGroup
										value={findGroupByConfig(view) || 'none'}
										onValueChange={(value) => {
											updCollection({
												groupByConfigs: updGroupByConfig(
													view,
													value === 'none' || !value ? '' : value
												)
											});
										}}
									>
										<DropdownMenu.RadioItem value="none">None</DropdownMenu.RadioItem>

										{#each propertyState.properties as property (property.id)}
											{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
												<DropdownMenu.RadioItem value={property.id}>
													{property.name}
												</DropdownMenu.RadioItem>
											{/if}
										{/each}
									</DropdownMenu.RadioGroup>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					{/if}
				{/key}

				<SortDropdown options={sortOptions} bind:value={sort} />

				<ViewButtonsGroup options={[View.LIST, View.TABLE]} bind:value={view} />

				<Button on:click={() => (isCreateItemDialogOpen = true)}>New item</Button>
			</div>
		{:else}
			<div class="flex space-x-1">
				<SearchInput placeholder="Find Item" bind:value={search} />
				<SortDropdown options={sortOptions} bind:value={sort} />

				<Drawer.Root>
					<Drawer.Trigger asChild let:builder>
						<Button builders={[builder]} variant="secondary">
							{#if view === View.LIST}
								<StretchHorizontal class="icon-md" />
							{:else}
								<Table class="icon-md" />
							{/if}
						</Button>
					</Drawer.Trigger>
					<Drawer.Content>
						<Drawer.Header class="py-1">
							<div class="flex items-center space-x-2">
								<div class="p-2.5 rounded bg-secondary">
									{#if view === View.LIST}
										<StretchHorizontal class="icon-md" />
									{:else}
										<Table class="icon-md" />
									{/if}
								</div>
								<div class="text-base font-semibold">Appereance</div>
							</div>
						</Drawer.Header>
						<Drawer.Footer>
							<label for="view"> View </label>
							<RadioGroup.Root id="view" value={view} class="px-2 py-1 rounded-md bg-secondary/40">
								<Label for="list" class="flex items-center justify-between space-x-2">
									<div class="flex items-center space-x-2">
										<StretchHorizontal class="icon-md" />
										<span class="font-semibold text-lg"> List</span>
									</div>
									<RadioGroup.Item
										id="list"
										value={View.LIST}
										on:click={() => (view = View.LIST)}
									/>
								</Label>
								<Label for="table" class="flex items-center justify-between space-x-2">
									<div class="flex items-center space-x-2">
										<Table class="icon-md" />
										<span class="font-semibold text-lg">Table</span>
									</div>
									<RadioGroup.Item
										id="table"
										value={View.TABLE}
										on:click={() => (view = View.TABLE)}
									/>
								</Label>
							</RadioGroup.Root>
							<label for="visibility"> Visible in {capitalizeFirstLetter(view)} view </label>
							<div class="px-2 py-1 space-y-2.5 rounded-md bg-secondary/40">
								{#if view === View.LIST}
									{#each propertyState.properties as property}
										<div class="flex items-center justify-between">
											<Label
												for={`visibility-list-${property.id}`}
												class="flex font-semibold text-base"
											>
												<PropertyIcon key={property.type} />
												{property.name}
											</Label>

											<Switch
												id={`visibility-list-${property.id}`}
												checked={containsView(property.visibleInViews, View.LIST)}
												on:click={() =>
													updPropertyDebounced({
														id: property.id,
														visibleInViews: toggleView(property.visibleInViews, View.LIST)
													})}
											/>
										</div>
									{/each}
								{:else}
									{#each propertyState.properties as property}
										<div class="flex items-center justify-between">
											<Label
												for={`visibility-table-${property.id}`}
												class="flex font-semibold text-base"
											>
												<PropertyIcon key={property.type} />
												{property.name}
											</Label>
											<Switch
												id={`visibility-table-${property.id}`}
												checked={containsView(property.visibleInViews, View.TABLE)}
												on:click={() =>
													updPropertyDebounced({
														id: property.id,
														visibleInViews: toggleView(property.visibleInViews, View.TABLE)
													})}
											/>
										</div>
									{/each}
								{/if}
							</div>
							<label for="groupBy"> Group by </label>
							<RadioGroup.Root
								id="groupBy"
								value={findGroupByConfig(view) || 'none'}
								onValueChange={(value) =>
									updCollection({
										groupByConfigs: updGroupByConfig(view, value === 'none' || !value ? '' : value)
									})}
								class="px-2 py-1 rounded-md bg-secondary/40"
							>
								<div class="flex items-center justify-between">
									<Label for="group-by-none" class="w-full flex items-center ">
										<SquareSlash class="icon-sm mr-2" />
										<span class="grow font-semibold text-base">None</span>
									</Label>

									<RadioGroup.Item id="group-by-none" value="none" />
								</div>
								{#each propertyState.properties as property (property.id)}
									{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
										<div class="w-full flex items-center justify-between">
											<Label for={`group-by-${property.id}`} class="w-full flex items-center">
												<PropertyIcon key={property.type} />
												<span class="grow font-semibold text-base">{property.name}</span>
											</Label>

											<RadioGroup.Item id={`group-by-${property.id}`} value={property.id} />
										</div>
									{/if}
								{/each}
							</RadioGroup.Root>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Root>
			</div>
		{/if}
		{#if !findGroupByConfig(view)}
			<Items items={filteredItems} {view} clickOpenItem={(id) => clickItem(id)} />
		{:else}
			<Accordion.Root
				multiple
				value={Object.keys(groupedItems).map((k) => `accordion-item-${k}`)}
				class="w-full"
			>
				{#each Object.keys(groupedItems).sort(sortGroupedItems) as key (`group-item-${key}`)}
					{@const property = getProperty(groupedItems[key].pid)}

					{#if property}
						{@const color = getPropertyColor(property, key)}
						<Accordion.Item value={`accordion-item-${key}`}>
							<Accordion.Trigger class="justify-start p-2 hover:no-underline">
								{@render groupLabel(key, property, color)}
							</Accordion.Trigger>
							<Accordion.Content>
								<Items
									items={groupedItems[key].items}
									{view}
									clickOpenItem={(id) => clickItem(id)}
								/>
							</Accordion.Content>
						</Accordion.Item>
					{/if}
				{/each}
			</Accordion.Root>
		{/if}
		{#if $isDesktop}
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
						class="h-10 w-full pl-10 text-base font-semibold rounded bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
					/>
				</form>
			</div>
		{:else}
			<Button
				size="icon"
				class="fixed bottom-4 right-3 z-10 h-12 w-12 rounded-md"
				on:click={() => (isCreateItemDialogOpen = true)}
			>
				<Plus />
			</Button>
		{/if}
	</PageContent>
</PageContainer>

{#if $page.state.id}
	<!-- Item sliding-panel -->
	<SlidingPanel open={itemPanel.isOpen} class="w-full lg:w-1/3 p-0 lg:p-1 lg:pl-0">
		<ItemPage data={noCheck($page.state)} />
	</SlidingPanel>
{/if}
{#if $page.state.showPanel}
	<!-- Properties Sliding panel -->
	<SlidingPanel open={propertiesPanel.isOpen} class="w-full lg:w-1/3 p-0 lg:p-1 lg:pl-0">
		<PropertiesPage data={noCheck($page.state)} />
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
		/>

		<Button type="submit" class="w-full">Create</Button>
	</form>
</ItemNew>

{#snippet groupLabel(key: string, property: Property, color: Color)}
	<span
		class={cn('h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold', PROPERTY_COLORS[color])}
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
