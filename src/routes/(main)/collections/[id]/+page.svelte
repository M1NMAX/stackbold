<script lang="ts">
	import type { PageData } from './$types';
	import { onDestroy } from 'svelte';
	import {
		ArrowLeft,
		ArrowUpDown,
		Check,
		CheckSquare2,
		Copy,
		CornerUpRight,
		Eye,
		EyeOff,
		File,
		MoreHorizontal,
		Pin,
		PinOff,
		Plus,
		Settings2,
		Square,
		StretchHorizontal,
		Table,
		Trash,
		UserPlus,
		X
	} from 'lucide-svelte';
	import { PropertyType, View, type Item } from '@prisma/client';
	import { Items, groupItemsByPropertyValue, setActiveItemState } from '$lib/components/items';
	import {
		AddPropertyPopover,
		PropertyEditor,
		PropertyInput,
		PropertyInputWrapper,
		PropertyValueWrapper,
		containsView,
		//helpers
		getOption,
		getPropertyColor,
		getPropertyDefaultValue,
		toggleView
	} from '$lib/components/property';
	import debounce from 'debounce';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { RouterInputs } from '$lib/trpc/router';
	import { capitalizeFirstLetter, cn, sortFun, type SortOption } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import dayjs from '$lib/utils/dayjs';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { SlidingPanel } from '$lib/components/sliding-panel';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { IconPicker, icons } from '$lib/components/icon';
	import { page } from '$app/stores';
	import type { DeleteDetail } from '$lib/types';
	import { SearchInput, createSearchStore, searchHandler } from '$lib/components/search';
	import { SortDropdown } from '$lib/components/sort';
	import { ViewButton, ViewButtonsGroup, getScreenState } from '$lib/components/view';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Command from '$lib/components/ui/command';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Sheet from '$lib/components/ui/sheet';
	import { DEFAULT_SORT_OPTIONS, PROPERTY_COLORS } from '$lib/constant';
	import { storage } from '$lib/storage';
	import { onError } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import { textareaAutosizeAction } from 'svelte-legos';
	import { clickOutside } from '$lib/actions';
	import { superForm } from 'sveltekit-superforms/client';
	import { Label } from '$lib/components/ui/label';
	import { writable } from 'svelte/store';

	export let data: PageData;
	$: ({ collection, items, groups } = data);
	$: ({ properties } = collection);

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Item>[])];
	let sort = writable(sortOptions[0]);

	let view = writable<View>(View.LIST);
	let isSmallScreenDrawerOpen = false;
	let renameCollectionError: string | null = null;

	let itemNameError: string | null = null;

	let isMoveDialogOpen = false;
	let isSmallHeadingVisible = false;
	let isCreateItemDialogOpen = false;

	// Delete Modal
	let isDeleteModalOpen = false;
	let deleteDetail: DeleteDetail = { type: null };

	// item and properties sliding panel
	let isPropertiesPanelOpen = false;
	let isItemPanelOpen = false;

	let reload = false;

	const isDesktop = getScreenState();
	const activeItem = setActiveItemState(null);

	const DEBOUNCE_INTERVAL = 1000;

	// Collection service fuctions
	const updCollectionDebounced = debounce(updCollection, DEBOUNCE_INTERVAL);

	async function updCollection(detail: RouterInputs['collections']['update']['data']) {
		await trpc().collections.update.mutate({
			id: collection.id,
			data: detail
		});

		await invalidateAll();
		reload = !reload;
	}

	async function duplicateCollection() {
		const { id, name, ownerId, ...rest } = data.collection;

		const createdCollection = await trpc().collections.create.mutate({
			...rest,
			name: name + ' copy'
		});

		const itemsCopy = items.map((item) => {
			const { id, collectionId, ...rest } = item;
			return { collectionId: createdCollection.id, ...rest };
		});

		await trpc().items.createMany.mutate(itemsCopy);
		await invalidateAll();

		const msg = `Collection [${collection.name}] duplicated successfully`;
		const url = `/collections/${createdCollection.id}`;

		toast(msg, { action: { label: 'Go', onClick: () => goto(url) } });
	}

	async function deleteCollection(id: string, name: string) {
		try {
			await trpc().collections.delete.mutate(id);

			toast.success(`Collection [${name}] deleted successfully`);
			setTimeout(() => goto('/collections'), 1000);
		} catch (error) {
			onError(error);
		}
	}

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

	// handle create item form
	const { form, enhance } = superForm(data.form, {
		dataType: 'json',
		onSubmit: () => {
			form.update(
				($form) => {
					$form.collectionId = collection.id;
					$form.properties = collection.properties.map((prop) => ({
						id: prop.id,
						value: getPropertyDefaultValue(prop.type, prop.defaultValue)
					}));
					return $form;
				},
				{ taint: false }
			);
		}
	});

	async function handleClickOpenItem(id: string) {
		goto(`/collections/${collection.id}?id=${id}`);
	}

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);

	async function updItem(args: RouterInputs['items']['update']) {
		try {
			const updatedItem = await trpc().items.update.mutate(args);

			const itemsCopy = items.filter((item) => item.id !== updatedItem.id);
			items = [...itemsCopy, updatedItem];
		} catch (error) {
			onError(error);
		}
	}

	async function duplicateItem(itemId: string) {
		const item = items.find(({ id }) => id === itemId);
		if (!item) {
			onError({ location: '/collections/page[id]', msg: 'Invalid item selected' });
			return;
		}

		const { id, name, ...rest } = item;
		const createdItem = await trpc().items.create.mutate({ ...rest, name: name + ' copy' });

		items.push(createdItem);
		items = items;

		toast.success(`Item [${item.name}] duplicated successfully `);
	}

	async function deleteItem(id: string) {
		await trpc().items.delete.mutate(id);

		toast.success('Item deleted successfully');
		if ($page.url.searchParams.has('id') && $page.url.searchParams.get('id') === id) {
			isItemPanelOpen = false;
			$page.url.searchParams.delete('id');
			goto(`/collections/${collection.id}`);
		}

		data.items = items.filter((item) => item.id !== id);
	}

	// Item input handlers
	async function handleOnInputItemName(e: { currentTarget: EventTarget & HTMLHeadingElement }) {
		if (!$activeItem) return;
		const id = $activeItem.id;

		//TODO: valide inner text
		const name = e.currentTarget.innerText;

		updItemDebounced({ id, data: { name } });
	}

	// Property Handlers
	function getProperty(pid: string) {
		return properties.find((property) => property.id === pid) || null;
	}

	function getPropertyValue(pid: string) {
		if (!$activeItem) return '';

		const itemProperty = $activeItem.properties.find((property) => property.id === pid);

		const collectionProperty = properties.find((property) => property.id === pid);

		if (!itemProperty || !collectionProperty) return '';

		if (collectionProperty.type !== 'SELECT') return itemProperty.value;

		const option = collectionProperty.options.find((opt) => opt.id === itemProperty.value);

		return option ? option.id : '';
	}

	async function addPropertyToCollection(args: RouterInputs['collections']['addProperty']) {
		const { properties: updatedProps } = await trpc().collections.addProperty.mutate(args);

		const sortedProps = updatedProps.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		return sortedProps[sortedProps.length - 1];
	}

	async function addProperty(type: PropertyType) {
		try {
			const name = capitalizeFirstLetter(type);

			const lastProperty = await addPropertyToCollection({
				id: collection.id,
				property: { name, type }
			});

			properties = [...properties, lastProperty];

			await Promise.all([
				trpc().items.addProperty.mutate({
					ids: items.map(({ id }) => id),
					property: { id: lastProperty.id, value: '' }
				}),
				trpc()
					.items.list.query(collection.id)
					.then((updatedItems) => {
						items = updatedItems;
					})
			]);
		} catch (error) {
			onError(error);
		}
	}

	async function duplicateProperty(pid: string) {
		const property = getProperty(pid);
		if (!property) {
			onError({ location: '/collections/page[id]', msg: 'Invalid property selected' });
			return;
		}

		try {
			const { id, name, createdAt, ...rest } = property;

			const lastAddedProperty = await addPropertyToCollection({
				id: collection.id,
				property: { ...rest, name: name + ' copy' }
			});

			properties = [...properties, lastAddedProperty];

			await trpc().items.addProperty.mutate({
				ids: items.map(({ id }) => id),
				property: {
					id: lastAddedProperty.id,
					value: ''
				}
			});
			items = await trpc().items.list.query(collection.id);
		} catch (error) {
			onError(error);
		}
	}

	const updPropertyDebounced = debounce(updProperty, DEBOUNCE_INTERVAL);
	async function updProperty(property: RouterInputs['collections']['updateProperty']['property']) {
		try {
			const updateCollection = await trpc().collections.updateProperty.mutate({
				id: collection.id,
				property
			});

			properties = updateCollection.properties;
		} catch (error) {
			onError(error);
		}
	}

	async function deleteProperty(pid: string) {
		try {
			await trpc().collections.deleteProperty.mutate({ id: collection.id, propertyId: pid });

			await trpc().items.deleteProperty.mutate({
				ids: items.map(({ id }) => id),
				propertyId: pid
			});

			properties = properties.filter((property) => property.id !== pid);

			toast.success('Property deleted successfully');
		} catch (error) {
			onError(error);
		}
	}

	//Property Value handle
	const updPropertyValueDebounced = debounce(updPropertyValue, DEBOUNCE_INTERVAL);

	async function updPropertyValue(id: string, property: { id: string; value: string }) {
		try {
			const updatedItem = await trpc().items.updateProperty.mutate({ id, property });

			if ($activeItem && $activeItem.id === updatedItem.id) $activeItem = updatedItem;

			await invalidateAll();
		} catch (error) {
			onError(error);
		}
	}

	//Property option services
	async function addOptionToProperty(pid: string, value: string) {
		try {
			const updatedCollection = await trpc().collections.addPropertyOption.mutate({
				id: collection.id,
				property: { id: pid, option: { value } }
			});

			//TODO: add: find a better solution, with lower overhead
			properties = updatedCollection.properties;
		} catch (error) {
			onError(error);
		}
	}
	const updPropertyOptionDebounced = debounce(updPropertyOption, DEBOUNCE_INTERVAL);

	type UpdOptionInput = RouterInputs['collections']['updatePropertyOption']['property']['option'];
	async function updPropertyOption(pid: string, option: UpdOptionInput) {
		try {
			const updatedCollection = await trpc().collections.updatePropertyOption.mutate({
				id: collection.id,
				property: { id: pid, option }
			});

			//TODO: upd: find a better solution, with lower overhead
			properties = updatedCollection.properties;
		} catch (error) {
			onError(error);
		}
	}

	async function deletePropertyOption(pid: string, optionId: string) {
		try {
			const updatedCollection = await trpc().collections.deletePropertyOption.mutate({
				id: collection.id,
				property: { id: pid, optionId }
			});

			// TODO: think about items that use the deleted property
			//TODO: del: find a better solution, with lower overhead
			properties = updatedCollection.properties;

			// toast.success('Property option deleted successfully');
		} catch (error) {
			onError(error);
		}
	}

	async function handleDelete() {
		switch (deleteDetail.type) {
			case 'collection':
				deleteCollection(deleteDetail.id, deleteDetail.name);
				break;

			case 'item':
				deleteItem(deleteDetail.id);
				break;

			case 'property':
				deleteProperty(deleteDetail.id);
				break;

			case 'option':
				deletePropertyOption(deleteDetail.id, deleteDetail.option);
				break;
		}
		isDeleteModalOpen = false;
	}

	function preventEnterKeypress(e: KeyboardEvent) {
		if (e.key == 'Enter') e.preventDefault();
	}

	function closeSmallScreenDrawer() {
		isSmallScreenDrawerOpen = false;
	}

	function openMoveDialog() {
		isMoveDialogOpen = true;
	}

	function closeMoveDialog() {
		isMoveDialogOpen = false;
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmallHeadingVisible = true;
		else isSmallHeadingVisible = false;
	}

	function includesGroupableProperties() {
		return properties.some(({ type }) => type === 'SELECT' || type === 'CHECKBOX');
	}

	function addSearchTerms() {
		return data.items.map((item) => ({ ...item, searchTerms: item.name }));
	}

	function removeSearchTerms(data: typeof searchItems) {
		return data.map(({ searchTerms, ...rest }) => ({ ...rest }));
	}

	const searchItems = addSearchTerms();

	const searchStore = createSearchStore(searchItems);

	const unsubscribe = searchStore.subscribe((modal) => searchHandler(modal));

	onDestroy(() => {
		unsubscribe();
	});

	$: if ($page.url.searchParams.has('id')) {
		isPropertiesPanelOpen = false;
		isItemPanelOpen = true;

		const itemId = $page.url.searchParams.get('id');
		$activeItem = items.find((item) => item.id === itemId) || null;
	} else {
		isItemPanelOpen = false;
		$activeItem = null;
	}

	$: collection.id, ($searchStore.data = addSearchTerms());
	$: collection.id, ($searchStore.search = '');

	$: {
		sort = storage(`collection-${data.collection.id}-sort`, sortOptions[0]);
	}
	$: $sort, ($searchStore.filtered = $searchStore.data.sort(sortFun($sort.field, $sort.order)));

	$: {
		view = storage(`collection-${data.collection.id}-view`, View.LIST);
	}
	$: groupedItems = $searchStore.filtered.reduce(
		groupItemsByPropertyValue(findGroupByConfig($view) || ''),
		{}
	);

	function findGroupByConfig(view: View) {
		const config = collection.groupByConfigs.find((config) => config.view === view);
		if (!config || config.propertyId === '') return null;
		return config.propertyId;
	}

	function updGroupByConfig(view: View, value: string) {
		// TODO: ref
		const tmpGroupByConfigs = [
			{
				view: View.LIST,
				propertyId: ''
			},
			{
				view: View.TABLE,
				propertyId: ''
			}
		];
		if (collection.groupByConfigs.length === 0) collection.groupByConfigs = tmpGroupByConfigs;
		return collection.groupByConfigs.map((config) => {
			if (config.view !== view) return config;
			return {
				view,
				propertyId: value
			};
		});
	}

	// Properties Sliding panel
	let currentOpenPropEditor: string | null = null;
	function onClickTogglePropertyEditor(propId: string | null) {
		currentOpenPropEditor = propId;
	}

	function openPropertiesPanel() {
		if (properties.length != 0 && currentOpenPropEditor == null) {
			currentOpenPropEditor = properties[0].id;
		}
		isItemPanelOpen = false;
		isPropertiesPanelOpen = true;
	}

	function closePropertiesPanel() {
		isPropertiesPanelOpen = false;
	}
</script>

<svelte:head>
	<title>{collection.name} - Stackbold</title>
</svelte:head>

<PageContainer
	class={cn(
		'flex flex-col space-y-1 ease-in-out duration-300',
		(isPropertiesPanelOpen || isItemPanelOpen) && 'w-2/3'
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
				<svelte:component this={icons[collection.icon]} class="icon-md" />
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

				<Button variant="secondary" size="icon" disabled>
					<UserPlus />
				</Button>

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

				<Button variant="secondary" size="icon" on:click={openPropertiesPanel}>
					<Settings2 />
				</Button>
				{#if $isDesktop}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} variant="secondary" size="icon">
								<MoreHorizontal />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-56">
							<DropdownMenu.Group>
								<DropdownMenu.Item
									on:click={() => updCollection({ isDescHidden: !collection.isDescHidden })}
									class="space-x-1"
								>
									{#if collection.isDescHidden}
										<Eye class="icon-xs" />
										<span> Show description </span>
									{:else}
										<EyeOff class="icon-xs" />
										<span> Hide description </span>
									{/if}
								</DropdownMenu.Item>
								<DropdownMenu.Item on:click={openMoveDialog} class="space-x-1">
									<CornerUpRight class="icon-xs" />
									<span>Move to</span>
								</DropdownMenu.Item>

								<DropdownMenu.Item on:click={duplicateCollection} class="space-x-1">
									<Copy class="icon-xs" />
									<span>Duplicate</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									class="space-x-1"
									on:click={() => {
										deleteDetail = { type: 'collection', id: collection.id, name: collection.name };
										isDeleteModalOpen = true;
									}}
								>
									<Trash class="icon-xs" />
									<span>Delete</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<Drawer.Root bind:open={isSmallScreenDrawerOpen}>
						<Drawer.Trigger asChild let:builder>
							<Button builders={[builder]} size="icon" variant="secondary">
								<MoreHorizontal class="icon-xs" />
							</Button>
						</Drawer.Trigger>
						<Drawer.Content>
							<Drawer.Header class="py-2">
								<div class="flex items-center space-x-2">
									<div class="p-2.5 rounded bg-secondary">
										<svelte:component this={icons[collection.icon]} class="icon-sm" />
									</div>

									<div class="flex flex-col items-start justify-start">
										<div class=" text-base font-semibold truncate">{collection.name}</div>
										<div class="text-sm">
											{groups.find((group) => group.id === collection.groupId)?.name ??
												'Without group'}
										</div>
									</div>
								</div>
							</Drawer.Header>
							<Drawer.Footer class="pt-2">
								<Button
									variant="secondary"
									on:click={() => {
										updCollection({ isPinned: !collection.isPinned });
										closeSmallScreenDrawer();
									}}
								>
									{#if collection.isPinned}
										<PinOff class="icon-xs" />
										<span> Remove from Sidebar</span>
									{:else}
										<Pin class="icon-xs" />
										<span> Add to Sidebar </span>
									{/if}
								</Button>
								<Button
									variant="secondary"
									on:click={() => {
										closeSmallScreenDrawer();
										openMoveDialog();
									}}
								>
									<CornerUpRight class="icon-xs" />
									<span>Move to</span>
								</Button>
								<Button
									variant="secondary"
									on:click={() => {
										duplicateCollection();
										closeSmallScreenDrawer();
									}}
								>
									<Copy class="icon-xs" />
									<span>Duplicate</span>
								</Button>
								<Button
									variant="destructive"
									on:click={() => {
										closeSmallScreenDrawer();
										deleteDetail = { type: 'collection', id: collection.id, name: collection.name };
										isDeleteModalOpen = true;
									}}
								>
									<Trash class="icon-xs" />
									<span>Delete</span>
								</Button>
							</Drawer.Footer>
						</Drawer.Content>
					</Drawer.Root>
				{/if}
			</div>
		</div>
	</PageHeader>

	<PageContent class="relative lg:pt-1 lg:pb-12 lg:px-8" on:scroll={handleScroll}>
		<div class=" flex items-center space-x-2">
			<IconPicker name={collection.icon} onIconChange={(icon) => updCollection({ icon })} />

			<h1
				class="grow font-semibold text-2xl md:text-3xl focus:outline-none"
				contenteditable
				spellcheck={false}
				on:keypress={preventEnterKeypress}
				on:input={handleOnInputCollectionName}
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

				<textarea
					use:textareaAutosizeAction
					id="description"
					value={collection.description}
					on:input={handleOnInputCollectionDesc}
					spellcheck={false}
					class="textarea textarea-ghost"
				/>
			{/if}
		{/key}

		{#if $isDesktop}
			<!-- upper navigation handler -->
			<div class="sticky -top-1 z-10 flex justify-between space-x-2 bg-card">
				<SearchInput placeholder="Find Item" bind:value={$searchStore.search} />

				<!-- Only show groupby btn if collection properties includes a 'SELECT' or 'CHECKBOX' -->
				{#key properties}
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
										value={findGroupByConfig($view) || 'none'}
										onValueChange={(value) => {
											updCollection({
												groupByConfigs: updGroupByConfig(
													$view,
													value === 'none' || !value ? '' : value
												)
											});
										}}
									>
										<DropdownMenu.RadioItem value="none">None</DropdownMenu.RadioItem>

										{#each properties as property (property.id)}
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

				<SortDropdown {sortOptions} bind:currentSort={$sort} />

				{#key $view}
					<ViewButtonsGroup bind:view={$view}>
						<ViewButton value={View.LIST}>
							<StretchHorizontal class="icon-md" />
						</ViewButton>
						<ViewButton value={View.TABLE}>
							<Table class="icon-md" />
						</ViewButton>
					</ViewButtonsGroup>
				{/key}

				<Button on:click={() => (isCreateItemDialogOpen = true)}>New item</Button>
			</div>
		{:else}
			<div class="flex space-x-1">
				<SearchInput placeholder="Find Item" bind:value={$searchStore.search} />
				<Drawer.Root>
					<Drawer.Trigger asChild let:builder>
						<Button builders={[builder]} variant="secondary">
							<ArrowUpDown class="icon-sm" />
						</Button>
					</Drawer.Trigger>
					<Drawer.Content>
						<Drawer.Header class="py-1">
							<div class="flex items-center space-x-2">
								<div class="p-2.5 rounded bg-secondary">
									<ArrowUpDown class="icon-sm" />
								</div>
								<div class="text-base font-semibold">Sort By</div>
							</div>
						</Drawer.Header>
						<Drawer.Footer>
							<RadioGroup.Root
								id="sort"
								value={$sort.field + '-' + $sort.order}
								class="px-2 py-1 rounded-md bg-secondary"
							>
								{#each sortOptions as sortOpt}
									<Label class="flex items-center justify-between space-x-2">
										<span class="font-semibold text-lg"> {sortOpt.label} </span>
										<RadioGroup.Item
											value={sortOpt.field + '-' + sortOpt.order}
											id={sortOpt.label}
											on:click={() => {
												$sort = { ...sortOpt };
											}}
										/>
									</Label>
								{/each}
							</RadioGroup.Root></Drawer.Footer
						>
					</Drawer.Content>
				</Drawer.Root>
				<Drawer.Root>
					<Drawer.Trigger asChild let:builder>
						<Button builders={[builder]} variant="secondary">
							{#if $view === View.LIST}
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
									{#if $view === View.LIST}
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
							<RadioGroup.Root id="view" value={$view} class="px-2 py-1 rounded-md bg-secondary">
								<Label for="list" class="flex items-center justify-between space-x-2">
									<div class="flex items-center space-x-2">
										<StretchHorizontal class="icon-md" />
										<span class="font-semibold text-lg"> List</span>
									</div>
									<RadioGroup.Item value="list" id="list" on:click={() => ($view = View.LIST)} />
								</Label>
								<Label for="table" class="flex items-center justify-between space-x-2">
									<div class="flex items-center space-x-2">
										<Table class="icon-md" />
										<span class="font-semibold text-lg">Table</span>
									</div>
									<RadioGroup.Item value="table" id="table" on:click={() => ($view = View.TABLE)} />
								</Label>
							</RadioGroup.Root>
							<label for="visibility"> Visible in {view} </label>
							<div class="px-2 py-1 rounded-md bg-secondary">
								{#if $view === View.LIST}
									{#each properties as property}
										<div class="flex items-center justify-between">
											<label for={property.id} class="font-semibold text-base">
												{property.name}
											</label>
											<input
												id={property.id}
												type="checkbox"
												checked={containsView(property.visibleInViews, View.LIST)}
												class="checkbox"
												on:click={() =>
													updPropertyDebounced({
														id: property.id,
														visibleInViews: toggleView(property.visibleInViews, View.LIST)
													})}
											/>
										</div>
									{/each}
								{:else}
									{#each properties as property}
										<div class="flex items-center justify-between">
											<label for={property.id} class="font-semibold text-base">
												{property.name}
											</label>
											<input
												id={property.id}
												type="checkbox"
												checked={containsView(property.visibleInViews, View.TABLE)}
												class="checkbox"
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
								value={findGroupByConfig($view) || 'none'}
								onValueChange={(value) =>
									updCollection({
										groupByConfigs: updGroupByConfig($view, value === 'none' || !value ? '' : value)
									})}
								class="px-2 py-1 rounded-md bg-secondary"
							>
								<Label for="list" class="flex items-center justify-between space-x-2">
									<span class="font-semibold text-base">None</span>
									<RadioGroup.Item value="none" />
								</Label>
								{#each properties as property (property.id)}
									{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
										<Label for="list" class="flex items-center justify-between space-x-2">
											<span class="font-semibold text-base">{property.name}</span>
											<RadioGroup.Item value={property.id} />
										</Label>
									{/if}
								{/each}
							</RadioGroup.Root>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Root>
			</div>
		{/if}
		{#key reload}
			{#if !findGroupByConfig($view)}
				<Items
					items={removeSearchTerms($searchStore.filtered)}
					view={$view}
					{properties}
					on:clickOpenItem={(e) => handleClickOpenItem(e.detail)}
					on:clickDuplicateItem={(e) => duplicateItem(e.detail)}
					on:clickDeleteItem={(e) => {
						deleteDetail = { type: 'item', id: e.detail };
						isDeleteModalOpen = true;
					}}
					on:updPropertyValue={({ detail }) => {
						updPropertyValueDebounced(detail.itemId, {
							id: detail.property.id,
							value: detail.property.value
						});
					}}
					on:updPropertyVisibility={({ detail }) => {
						updPropertyDebounced({ id: detail.pid, [detail.name]: detail.value });
					}}
					on:renameItem={({ detail }) => {
						updItemDebounced({ id: detail.id, data: { name: detail.name } });
					}}
				/>
			{/if}
			{#if findGroupByConfig($view)}
				<Accordion.Root
					multiple
					value={Object.keys(groupedItems).map((k) => `accordion-item-${k}`)}
					class="w-full"
				>
					{#each Object.keys(groupedItems) as key (`group-item-${key}`)}
						{@const property = getProperty(groupedItems[key].pid)}

						{#if property}
							{@const color = getPropertyColor(property, key)}
							<Accordion.Item value={`accordion-item-${key}`}>
								<Accordion.Trigger class="justify-start p-2 hover:no-underline">
									<PropertyValueWrapper isWrappered class={PROPERTY_COLORS[color]}>
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
									</PropertyValueWrapper>
								</Accordion.Trigger>
								<Accordion.Content>
									<Items
										items={groupedItems[key].items}
										view={$view}
										{properties}
										on:clickOpenItem={(e) => handleClickOpenItem(e.detail)}
										on:clickDuplicateItem={(e) => duplicateItem(e.detail)}
										on:clickDeleteItem={(e) => {
											deleteDetail = { type: 'item', id: e.detail };
											isDeleteModalOpen = true;
										}}
										on:updPropertyValue={({ detail }) => {
											updPropertyValueDebounced(detail.itemId, {
												id: detail.property.id,
												value: detail.property.value
											});
										}}
										on:updPropertyVisibility={({ detail }) => {
											updPropertyDebounced({ id: detail.pid, [detail.name]: detail.value });
										}}
										on:renameItem={({ detail }) => {
											updItemDebounced({ id: detail.id, data: { name: detail.name } });
										}}
									/>
								</Accordion.Content>
							</Accordion.Item>
						{/if}
					{/each}
				</Accordion.Root>
			{/if}
		{/key}
		{#if $isDesktop}
			<div class="sticky inset-x-0 bottom-0">
				{#if itemNameError}
					<span
						use:clickOutside
						on:clickoutside={() => (itemNameError = null)}
						class="w-full text-error"
					>
						{itemNameError}
					</span>
				{/if}
				<form class="relative" method="post" action="?/createItem" use:enhance>
					<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
						<Plus class="text-primary" />
					</div>
					<input
						name="name"
						placeholder="New item"
						bind:value={$form.name}
						autocomplete="off"
						class="h-10 w-full pl-10 text-base font-semibold rounded bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
					/>

					<input type="submit" class="hidden" />
				</form>
			</div>
		{/if}

		{#if !$isDesktop}
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

<!-- Item sliding-panel -->
<SlidingPanel bind:open={isItemPanelOpen} class="w-full lg:w-1/3 p-0 lg:p-1 lg:pl-0">
	<div class="h-full flex flex-col space-y-1.5 p-1 rounded-md bg-card">
		<div class="flex justify-between items-center">
			<Button
				variant="secondary"
				size="icon"
				on:click={() => {
					$page.url.searchParams.delete('id');
					goto(`/collections/${collection.id}`);
					isItemPanelOpen = false;
					$activeItem = null;
				}}
			>
				{#if $isDesktop}
					<X />
				{:else}
					<ArrowLeft />
				{/if}
			</Button>

			<div class="flex items-center space-x-1.5">
				{#if $activeItem}
					<span class="font-semibold text-xs text-gray-500">
						Updated
						{dayjs($activeItem.updatedAt).fromNow()}
					</span>
				{/if}

				{#if $isDesktop}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} variant="secondary" size="icon">
								<MoreHorizontal />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-56">
							<DropdownMenu.Group>
								<DropdownMenu.Item
									class="space-x-2"
									on:click={() => {
										if (!$activeItem) return;
										duplicateItem($activeItem.id);
									}}
								>
									<Copy class="icon-xs" />
									<span>Duplicate</span>
								</DropdownMenu.Item>

								<DropdownMenu.Item
									class="space-x-2"
									on:click={() => {
										if (!$activeItem) return;

										deleteDetail = { type: 'item', id: $activeItem.id };
										isDeleteModalOpen = true;
									}}
								>
									<Trash class="icon-xs" />
									<span>Delete</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<Drawer.Root>
						<Drawer.Trigger asChild let:builder>
							<Button builders={[builder]} variant="secondary" size="icon">
								<MoreHorizontal />
							</Button>
						</Drawer.Trigger>
						<Drawer.Content>
							<Drawer.Header class="py-2">
								<div class="flex items-center space-x-2 overflow-hidden">
									<div class="p-2.5 rounded bg-secondary">
										<File class="icon-sm" />
									</div>

									<div class="flex flex-col items-start justify-start">
										<div class=" text-base font-semibold truncate">{$activeItem?.name}</div>
										<div class="text-sm">{collection.name}</div>
									</div>
								</div>
							</Drawer.Header>
							<Drawer.Footer class="pt-2">
								<Button
									variant="secondary"
									on:click={() => {
										if (!$activeItem) return;
										duplicateItem($activeItem.id);
									}}
								>
									<Copy class="icon-xs" />
									<span>Duplicate</span>
								</Button>
								<Button
									variant="destructive"
									on:click={() => {
										if (!$activeItem) return;

										deleteDetail = { type: 'item', id: $activeItem.id };
										isDeleteModalOpen = true;
									}}
								>
									<Trash class="icon-xs" />
									<span>Delete</span>
								</Button>
							</Drawer.Footer>
						</Drawer.Content>
					</Drawer.Root>
				{/if}
			</div>
		</div>

		<div class="grow flex flex-col space-y-4 overflow-y-auto">
			<h2
				id="item-name"
				contenteditable
				spellcheck={false}
				on:keypress={preventEnterKeypress}
				on:input={handleOnInputItemName}
				class="pt-1 text-2xl font-semibold break-words focus:outline-none"
			>
				{$activeItem?.name}
			</h2>

			<div class="space-y-2">
				{#each properties as property}
					<PropertyInputWrapper
						{property}
						on:updPropertyField={({ detail }) =>
							updPropertyDebounced({ id: detail.pid, [detail.name]: detail.value })}
						on:duplicate={(e) => duplicateProperty(e.detail)}
						on:delete={(e) => {
							deleteDetail = { id: e.detail, type: 'property' };
							isDeleteModalOpen = true;
						}}
						on:addOpt={({ detail }) => addOptionToProperty(detail.propertyId, detail.value)}
						on:updOptColor={({ detail }) => {
							updPropertyOptionDebounced(detail.propertyId, {
								id: detail.optionId,
								color: detail.color
							});
						}}
						on:updOptValue={({ detail }) => {
							updPropertyOptionDebounced(detail.propertyId, {
								id: detail.optionId,
								value: detail.value
							});
						}}
						on:deleteOpt={({ detail }) => {
							deleteDetail = {
								type: 'option',
								id: detail.propertyId,
								option: detail.optionId
							};
							isDeleteModalOpen = true;
						}}
					>
						{#key $activeItem?.id}
							<PropertyInput
								{property}
								value={getPropertyValue(property.id)}
								on:updPropertyValue={({ detail }) => {
									if (!$activeItem) return;

									updPropertyValueDebounced($activeItem.id, {
										id: detail.pid,
										value: detail.value
									});
								}}
							/>
						{/key}
					</PropertyInputWrapper>
				{/each}
			</div>
		</div>
		<div>
			<AddPropertyPopover on:clickPropType={({ detail }) => addProperty(detail)} />
		</div>
	</div>
</SlidingPanel>

<!-- Properties Sliding panel -->
<SlidingPanel open={isPropertiesPanelOpen} class="w-full lg:w-1/3 p-0 lg:p-1 lg:pl-0">
	<div class="h-full flex flex-col space-y-1.5 p-2 rounded-md bg-card">
		<div class="flex items-center space-x-4">
			<Button variant="secondary" size="icon" on:click={closePropertiesPanel}>
				{#if $isDesktop}
					<X />
				{:else}
					<ArrowLeft />
				{/if}
			</Button>

			<h2 class="text-xl font-semibold">Properties</h2>
		</div>

		<div class="grow flex flex-col space-y-2 overflow-y-auto">
			{#each properties as property}
				<PropertyEditor
					{property}
					isOpen={currentOpenPropEditor === property.id}
					on:openChange={(e) => onClickTogglePropertyEditor(e.detail)}
					on:updPropertyField={({ detail }) =>
						updPropertyDebounced({ id: detail.pid, [detail.name]: detail.value })}
					on:duplicate={(e) => duplicateProperty(e.detail)}
					on:delete={(e) => {
						deleteDetail = { id: e.detail, type: 'property' };
						isDeleteModalOpen = true;
					}}
					on:addOpt={({ detail }) => addOptionToProperty(detail.propertyId, detail.value)}
					on:updOptColor={({ detail }) => {
						updPropertyOptionDebounced(detail.propertyId, {
							id: detail.optionId,
							color: detail.color
						});
					}}
					on:updOptValue={({ detail }) => {
						updPropertyOptionDebounced(detail.propertyId, {
							id: detail.optionId,
							value: detail.value
						});
					}}
					on:deleteOpt={({ detail }) => {
						deleteDetail = {
							type: 'option',
							id: detail.propertyId,
							option: detail.optionId
						};
						isDeleteModalOpen = true;
					}}
				/>
			{/each}
		</div>
		<div>
			<AddPropertyPopover on:clickPropType={({ detail }) => addProperty(detail)} />
		</div>
	</div>
</SlidingPanel>

{#if $isDesktop}
	<Dialog.Root bind:open={isCreateItemDialogOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title class="text-center">New item</Dialog.Title>
			</Dialog.Header>

			<form use:enhance method="post" action="?/createItem" class="flex flex-col space-y-2">
				<label for="item-name"> Name</label>

				<input
					id="item-name"
					placeholder="New item"
					name="name"
					autocomplete="off"
					class="input"
					bind:value={$form.name}
				/>

				<Button type="submit" class="w-full">Create</Button>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Sheet.Root bind:open={isCreateItemDialogOpen}>
		<Sheet.Content side="bottom">
			<Sheet.Header>
				<Sheet.Title class="text-center">New item</Sheet.Title>
			</Sheet.Header>

			<form use:enhance method="post" action="?/createItem" class="flex flex-col space-y-2">
				<label for="item-name"> Name</label>

				<input
					id="item-name"
					placeholder="New item"
					name="name"
					autocomplete="off"
					class="input"
					bind:value={$form.name}
				/>

				<Button type="submit" class="w-full">Create</Button>
			</form>
		</Sheet.Content>
	</Sheet.Root>
{/if}

<Command.Dialog bind:open={isMoveDialogOpen}>
	<Command.Input placeholder="Move collection to..." />
	<Command.List>
		<Command.Empty>No group found.</Command.Empty>
		<Command.Group>
			{#each groups as group (group.id)}
				<Command.Item
					value={group.name}
					onSelect={() => {
						updCollection({ groupId: group.id });
						closeMoveDialog();
						closeSmallScreenDrawer();
					}}
					class="space-x-2"
				>
					<Check class={cn('icon-xxs', group.id !== collection.groupId && 'text-transparent')} />

					<span> {group.name} </span>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>

<AlertDialog.Root bind:open={isDeleteModalOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete</AlertDialog.Title>
			<AlertDialog.Description class="text-lg">
				Are you sure you want to delete this {deleteDetail.type} ?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action asChild let:builder>
				<Button builders={[builder]} variant="destructive" on:click={handleDelete}>Continue</Button>
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
