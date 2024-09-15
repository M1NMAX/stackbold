<script lang="ts">
	import {
		ArrowLeft,
		Check,
		CheckSquare2,
		Pin,
		PinOff,
		Plus,
		Settings2,
		Square,
		SquareSlash,
		StretchHorizontal,
		Table,
		X
	} from 'lucide-svelte';
	import { PropertyType, View, type Item } from '@prisma/client';
	import {
		ItemMenuPanel,
		ItemNew,
		Items,
		groupItemsByPropertyValue,
		setActiveItemState
	} from '$lib/components/items';
	import {
		AddPropertyPopover,
		PropertyEditor,
		PropertyIcon,
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
	import { SearchInput } from '$lib/components/search';
	import { SortDropdown } from '$lib/components/sort';
	import { ViewButtonsGroup, getScreenState } from '$lib/components/view';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Command from '$lib/components/ui/command';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { DEFAULT_SORT_OPTIONS, PROPERTY_COLORS } from '$lib/constant';
	import { onError } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import { clickOutside } from '$lib/actions';
	import { superForm } from 'sveltekit-superforms/client';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { CollectionMenu } from '$lib/components/collection';
	import { ModalState } from '$lib/components/modal/modalState.svelte.js';

	let { data } = $props();
	let collection = $state(data.collection);
	let items = $state(data.items);
	let groups = $state(data.groups);
	let properties = $state(data.collection.properties);

	$effect(() => {
		items = data.items;
		groups = data.groups;
		collection = data.collection;
		properties = data.collection.properties;
	});
	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Item>[])];

	let sort = $state(sortOptions[0]);

	let search = $state('');
	let filteredItems = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return items
			.filter((item) => item.name.toLowerCase().includes(searchTerm))
			.sort(sortFun(sort.field, sort.order));
	});

	const Icon = $derived(icons[collection.icon]);

	let view = $state<View>(View.LIST);
	let groupedItems = $derived.by(() => {
		return filteredItems.reduce(groupItemsByPropertyValue(findGroupByConfig(view) || ''), {});
	});

	let renameCollectionError = $state<string | null>(null);

	let itemNameError: string | null = null;

	let isMoveDialogOpen = $state(false);
	let isSmallHeadingVisible = $state(false);
	let isCreateItemDialogOpen = $state(false);

	// Delete Modal
	let deleteDetail = $state<DeleteDetail>({ type: null });
	let isDeleteModalOpen = $state(false);

	// item and properties sliding panel
	let isPropertiesPanelOpen = $state(false);
	let isItemPanelOpen = $state(false);

	let reload = $state(false);

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

	$effect(() => {
		if ($page.url.searchParams.has('id')) {
			isPropertiesPanelOpen = false;
			isItemPanelOpen = true;
			const itemId = $page.url.searchParams.get('id');
			$activeItem = items.find((item) => item.id === itemId) || null;
		} else {
			isItemPanelOpen = false;
			$activeItem = null;
		}
	});

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
		const actualProp = properties.find((prop) => prop.id === propId);
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

	// Properties Sliding panel
	let currentOpenPropEditor = $state<string | null>(null);
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
		currentOpenPropEditor = null;
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

				<Button variant="secondary" size="icon" on:click={openPropertiesPanel}>
					<Settings2 />
				</Button>

				<CollectionMenu
					{collection}
					groupName={groups.find((group) => group.id === collection.groupId)?.name ?? null}
					onClickToggleDescState={() => updCollection({ isDescHidden: !collection.isDescHidden })}
					onClickMove={openMoveDialog}
					onClickDuplicate={duplicateCollection}
					onClickDelete={() => {
						deleteDetail = { type: 'collection', id: collection.id, name: collection.name };
						isDeleteModalOpen = true;
					}}
				/>
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

				<!-- svelte-ignore element_invalid_self_closing_tag -->
				<textarea
					id="description"
					value={collection.description}
					oninput={handleOnInputCollectionDesc}
					spellcheck={false}
					class="textarea textarea-ghost"
				/>
			{/if}
		{/key}

		{#if $isDesktop}
			<!-- upper navigation handler -->
			<div class="sticky -top-1 z-10 flex justify-between space-x-2 bg-card">
				<SearchInput placeholder="Find Item" bind:value={search} />

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
									{#each properties as property}
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
									{#each properties as property}
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
								{#each properties as property (property.id)}
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
		{#key reload}
			{#if !findGroupByConfig(view)}
				<Items
					items={filteredItems}
					{view}
					{properties}
					clickOpenItem={(id) => handleClickOpenItem(id)}
					clickDuplicateItem={(id) => duplicateItem(id)}
					clickDeleteItem={(id) => {
						deleteDetail = { type: 'item', id: id };
						isDeleteModalOpen = true;
					}}
					updPropertyValue={(itemId, property) => {
						updPropertyValueDebounced(itemId, {
							id: property.id,
							value: property.value
						});
					}}
					updPropertyVisibility={(id, name, value) => {
						updPropertyDebounced({ id, [name]: value });
					}}
					renameItem={(id, name) => updItemDebounced({ id, data: { name } })}
				/>
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
										{view}
										{properties}
										clickOpenItem={(id) => handleClickOpenItem(id)}
										clickDuplicateItem={(id) => duplicateItem(id)}
										clickDeleteItem={(id) => {
											deleteDetail = { type: 'item', id: id };
											isDeleteModalOpen = true;
										}}
										updPropertyValue={(itemId, property) => {
											updPropertyValueDebounced(itemId, {
												id: property.id,
												value: property.value
											});
										}}
										updPropertyVisibility={(id, name, value) => {
											updPropertyDebounced({ id, [name]: value });
										}}
										renameItem={(id, name) => updItemDebounced({ id, data: { name } })}
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
				<!-- TODO: CHANGE URG -->
				<!-- {#if itemNameError}
					<span
						use:clickOutside
						on:clickoutside={() => (itemNameError = null)}
						class="w-full text-error"
					>
						{itemNameError}
					</span>
				{/if} -->
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

<!-- Item sliding-panel -->
<SlidingPanel bind:open={isItemPanelOpen} class="w-full lg:w-1/3 p-0 lg:p-1 lg:pl-0">
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

		{#if $activeItem != null}
			<div class="flex items-center space-x-1.5">
				<span class="font-semibold text-xs text-gray-500">
					Updated
					{dayjs($activeItem.updatedAt).fromNow()}
				</span>
				<ItemMenuPanel
					itemId={$activeItem.id}
					itemName={$activeItem.name}
					collectionName={collection.name}
					onClickDuplicate={(id) => duplicateItem(id)}
					onClickDelete={(id) => {
						deleteDetail = { type: 'item', id: id };
						isDeleteModalOpen = true;
					}}
				/>
			</div>
		{/if}
	</div>

	<div class="grow flex flex-col space-y-4 overflow-y-auto">
		<h2
			id="item-name"
			contenteditable
			spellcheck={false}
			onkeypress={preventEnterKeypress}
			oninput={handleOnInputItemName}
			class="pt-1 text-2xl font-semibold break-words focus:outline-none"
		>
			{$activeItem?.name}
		</h2>

		<div class="space-y-2">
			{#each properties as property}
				<PropertyInputWrapper
					{property}
					updPropertyField={(pid, name, value) => updPropertyDebounced({ id: pid, [name]: value })}
					duplicate={(id) => duplicateProperty(id)}
					deleteProperty={(id) => {
						deleteDetail = { id: id, type: 'property' };
						isDeleteModalOpen = true;
					}}
					addOption={(propertyId, value) => addOptionToProperty(propertyId, value)}
					updOptColor={(propertyId, optionId, color) => {
						updPropertyOptionDebounced(propertyId, {
							id: optionId,
							color: color
						});
					}}
					updOptValue={(propertyId, optionId, value) => {
						updPropertyOptionDebounced(propertyId, {
							id: optionId,
							value: value
						});
					}}
					deleteOpt={(propertyId, optionId) => {
						deleteDetail = {
							type: 'option',
							id: propertyId,
							option: optionId
						};
						isDeleteModalOpen = true;
					}}
				>
					{#key $activeItem?.id}
						<PropertyInput
							{property}
							value={getPropertyValue(property.id)}
							updPropertyValue={(pid, value) => {
								if (!$activeItem) return;

								updPropertyValueDebounced($activeItem.id, {
									id: pid,
									value: value
								});
							}}
						/>
					{/key}
				</PropertyInputWrapper>
			{/each}
		</div>
	</div>
	<div>
		<AddPropertyPopover onClickPropertyType={(type) => addProperty(type)} />
	</div>
</SlidingPanel>

<!-- Properties Sliding panel -->
<SlidingPanel open={isPropertiesPanelOpen} class="w-full lg:w-1/3 p-0 lg:p-1 lg:pl-0">
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
				openChange={(value) => onClickTogglePropertyEditor(value)}
				updPropertyField={(pid, name, value) => updPropertyDebounced({ id: pid, [name]: value })}
				duplicate={(id) => duplicateProperty(id)}
				deleteProperty={(id) => {
					deleteDetail = { id: id, type: 'property' };
					isDeleteModalOpen = true;
				}}
				addOption={(propertyId, value) => addOptionToProperty(propertyId, value)}
				updOptColor={(propertyId, optionId, color) => {
					updPropertyOptionDebounced(propertyId, {
						id: optionId,
						color: color
					});
				}}
				updOptValue={(propertyId, optionId, value) => {
					updPropertyOptionDebounced(propertyId, {
						id: optionId,
						value: value
					});
				}}
				deleteOpt={(propertyId, optionId) => {
					deleteDetail = {
						type: 'option',
						id: propertyId,
						option: optionId
					};
					isDeleteModalOpen = true;
				}}
			/>
		{/each}
	</div>
	<div>
		<AddPropertyPopover onClickPropertyType={(type) => addProperty(type)} />
	</div>
</SlidingPanel>

<ItemNew bind:isOpen={isCreateItemDialogOpen}>
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
</ItemNew>

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
