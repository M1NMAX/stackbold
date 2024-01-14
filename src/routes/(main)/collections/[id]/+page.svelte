<script lang="ts">
	import type { PageData } from './$types';
	import { onDestroy } from 'svelte';
	import {
		Archive,
		ArrowLeft,
		CheckSquare2,
		Copy,
		Eye,
		EyeOff,
		Heart,
		MoreHorizontal,
		Plus,
		Square,
		StretchHorizontal,
		Table,
		Trash,
		UserPlus,
		X
	} from 'lucide-svelte';
	import { PropertyType, type Item } from '@prisma/client';
	import { Textarea } from '$lib/components';
	import { Items, groupItemsByPropertyValue, setActiveItemState } from '$lib/components/items';
	import {
		AddPropertyPopover,
		PropertyInput,
		PropertyInputWrapper,
		PropertyValueWrapper,
		//helpers
		getOption,
		getPropertyColor
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
	import { Sheet } from '$lib/components/sheet';
	import { errorToast, onError, redirectToast, successToast } from '$lib/components/feedback';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { IconPicker } from '$lib/components/icon';
	import { page } from '$app/stores';
	import type { DeleteDetail } from '$lib/types';
	import { SearchInput, createSearchStore, searchHandler } from '$lib/components/search';
	import { SortDropdown } from '$lib/components/sort';
	import { ViewButton, ViewButtonsGroup } from '$lib/components/view';
	import * as Accordion from '$lib/components/ui/accordion';
	import { DEFAULT_SORT_OPTIONS, PROPERTY_COLORS } from '$lib/constant';
	import { storage } from '$lib/storage';
	import { browser } from '$app/environment';
	import { mediaQuery } from 'svelte-legos';

	export let data: PageData;
	$: ({ collection, items } = data);
	$: ({ properties } = collection);

	const activeItem = setActiveItemState(null);

	let view = 'list';

	// Delete Modal
	let isDeleteModalOpen = false;
	let deleteDetail: DeleteDetail = { type: null };

	// Sheet
	let isOpen = false;

	const isDesktop = mediaQuery('(min-width: 768px)');

	const DEBOUNCE_INTERVAL = 1000;

	// Collection service fuctions
	const updCollectionDebounced = debounce(updCollection, DEBOUNCE_INTERVAL);

	async function updCollection(detail: RouterInputs['collections']['update']['data']) {
		await trpc().collections.update.mutate({
			id: collection.id,
			data: detail
		});

		// TODO: fix: strange behaviour if drawer is open
		await invalidateAll();
		successToast(`Collection [${collection.name}] updated successfully`);
	}

	async function duplicateCollection() {
		const { id, name, ownerId, ...rest } = data.collection;

		const createdCollection = await trpc().collections.create.mutate({
			...rest,
			name: name + ' copy'
		});

		const itemsCopy = items.map((item) => {
			const { id, collectionId, updatedByUserId, ...rest } = item;
			return { collectionId: createdCollection.id, ...rest };
		});

		await trpc().items.createMany.mutate(itemsCopy);
		await invalidateAll();

		const msg = `Collection [${collection.name}] duplicated successfully`;
		const url = `/collections/${createdCollection.id}`;

		redirectToast(msg, url);
	}

	async function deleteCollection(id: string, name: string) {
		if (collection.ownerId !== data.user.userId) {
			errorToast('Unauthorized');
			return;
		}

		try {
			await trpc().collections.delete.mutate(id);

			successToast(`Collection [${name}] deleted successfully`);
			setTimeout(() => goto('/collections'), 1000);
		} catch (error) {
			onError(error);
		}
	}

	// collection input handlers
	async function handleOnInputCollectionName(e: {
		currentTarget: EventTarget & HTMLHeadingElement;
	}) {
		const name = e.currentTarget.innerText;
		updCollectionDebounced({ name });
	}

	async function handleOnInputCollectionDesc(e: Event) {
		const description = (e.target as HTMLTextAreaElement).value;

		updCollectionDebounced({ description });
	}

	// Item service functions

	async function handleClickOpenItem(id: string) {
		goto(`/collections/${collection.id}?id=${id}`);
	}

	async function handleCreateItem(name: string, openDrawer: boolean) {
		try {
			//TODO: in the future, property may have default value
			const createdItem = await trpc().items.create.mutate({
				collectionId: collection.id,
				name,
				properties: collection.properties.map((prop) => ({
					id: prop.id,
					value: prop.type === 'CHECKBOX' ? 'false' : ''
				}))
			});

			items.push(createdItem);
			items = items;

			if (openDrawer) goto(`/collections/${collection.id}?id=${createdItem.id}`);
		} catch (error) {
			onError(error);
		}
	}

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);

	async function updItem(args: RouterInputs['items']['update']) {
		try {
			const updatedItem = await trpc().items.update.mutate(args);

			const itemsCopy = items.filter((item) => item.id !== updatedItem.id);
			items = [...itemsCopy, updatedItem];

			successToast('Item updated successfully');
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

		const { id, updatedByUserId, name, ...rest } = item;

		const createdItem = await trpc().items.create.mutate({ ...rest, name: name + ' copy' });

		items.push(createdItem);
		items = items;

		successToast(`Item [${createdItem.name}] duplicated successfully `);
	}

	async function deleteItem(id: string) {
		await trpc().items.delete.mutate(id);

		items = items.filter((item) => item.id !== id);

		successToast('Item deleted successfully');
		if ($page.url.searchParams.has('id') && $page.url.searchParams.get('id') === id) {
			isOpen = false;
			$page.url.searchParams.delete('id');
			goto(`/collections/${collection.id}`);
		}
	}

	// Item input handlers
	async function handleOnInputItemName(e: { currentTarget: EventTarget & HTMLHeadingElement }) {
		if (!$activeItem) return;
		const id = $activeItem.id;

		//TODO: valide inner text
		const name = e.currentTarget.innerText;

		updItemDebounced({ id, data: { name } });
	}

	async function handleKeypressNewItemInput(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;

		const targetEl = e.target as HTMLInputElement;
		const value = targetEl.value;
		//TODO: better validation
		if (value.length >= 1 && value.length < 255) {
			handleCreateItem(value, false);
			targetEl.value = '';
		}
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

			await trpc().items.addProperty.mutate({
				ids: items.map(({ id }) => id),
				property: { id: lastProperty.id, value: '' }
			});
			items = await trpc().items.list.query(collection.id);

			successToast('Property added successfully');
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
			successToast('Property duplicated successfully');
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

			successToast('Property updated successfully');
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

			successToast('Property deleted successfully');
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

			// update items overview
			const itemsCopy = items.filter((item) => item.id !== id);
			items = [...itemsCopy, updatedItem];

			// successToast('Property value update successfully');
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

			// successToast('New option added successfully');
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

			// successToast('Property option updated successfully');
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

			// successToast('Property option deleted successfully');
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

	$: if ($page.url.searchParams.has('id')) {
		isOpen = true;

		const itemId = $page.url.searchParams.get('id');
		$activeItem = items.find((item) => item.id === itemId) || null;
	} else {
		isOpen = false;
		$activeItem = null;
	}

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<Item>[])];

	const sort = storage(`sort-collection-${data.collection.id}`, sortOptions[0]);

	function loadSortFromLocalStorage(): SortOption<Item> {
		if (!browser) return sortOptions[0];

		const storedValueStr = localStorage.getItem(`sort-collection-${data.collection.id}`);
		if (!storedValueStr) return sortOptions[0];

		return JSON.parse(storedValueStr);
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

	$: collection.id, ($searchStore.data = addSearchTerms());
	$: collection.id, ($searchStore.search = '');
	// $: collection.id, ($sort = loadSortFromLocalStorage());

	$: $sort, ($searchStore.filtered = $searchStore.data.sort(sortFun($sort.field, $sort.order)));
	$: groupedItems = $searchStore.filtered.reduce(
		groupItemsByPropertyValue(collection.groupItemsBy || ''),
		{}
	);
</script>

<svelte:head>
	<title>{collection.name} - Stackbold</title>
</svelte:head>

<PageContainer class={cn('flex flex-col space-y-1 ease-in-out duration-300', isOpen && 'w-2/3')}>
	<PageHeader>
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
			on:click={() => updCollection({ isFavourite: !collection.isFavourite })}
		>
			<Heart class={cn(collection.isFavourite && 'fill-primary text-primary')} />
		</Button>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="secondary" size="icon"><MoreHorizontal /></Button>
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

					<DropdownMenu.Item on:click={duplicateCollection} class="space-x-1">
						<Copy class="icon-xs" />
						<span>Duplicate</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => updCollection({ isArchived: true })} class="space-x-1">
						<Archive class="icon-xs" />
						<span>Archive</span>
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
	</PageHeader>

	<PageContent class="relative lg:pt-1 lg:pb-12 lg:px-8">
		<div class="flex items-center space-x-2">
			<IconPicker name={collection.icon} onIconChange={(icon) => updCollection({ icon })} />

			<h1
				class="grow font-semibold text-3xl focus:outline-none"
				contenteditable
				spellcheck={false}
				on:keypress={preventEnterKeypress}
				on:input={handleOnInputCollectionName}
			>
				{collection.name}
			</h1>
		</div>

		{#if !collection.isDescHidden}
			<label transition:fade for="description" class="label p-1">
				<span class="sr-only label-text"> Collection description</span>
				<Textarea
					id="description"
					value={collection.description}
					on:input={handleOnInputCollectionDesc}
					spellcheck={false}
					class="w-full h-8 textarea textarea-ghost text-base"
				/>
			</label>
		{/if}

		{#if $isDesktop}
			<!-- upper navigation handler -->
			<div class="flex justify-between space-x-2">
				<SearchInput placeholder="Find Item" bind:value={$searchStore.search} />

				<!-- Only show groupby btn if collection properties includes a 'SELECT' or 'CHECKBOX' -->
				{#key properties}
					{#if view === 'list' && includesGroupableProperties()}
						<div>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild let:builder>
									<Button variant="secondary" builders={[builder]} class="w-full">Group by</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content class="w-56">
									<DropdownMenu.Label>Group by</DropdownMenu.Label>
									<DropdownMenu.Separator />
									<DropdownMenu.RadioGroup
										value={collection.groupItemsBy || 'none'}
										onValueChange={(value) =>
											updCollection({ groupItemsBy: value !== 'none' ? value : null })}
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

				<ViewButtonsGroup bind:view>
					<ViewButton value="list">
						<StretchHorizontal class="icon-md" />
					</ViewButton>
					<ViewButton value="table">
						<Table class="icon-md" />
					</ViewButton>
				</ViewButtonsGroup>
				<Button on:click={() => handleCreateItem('Untitled', true)}>New item</Button>
			</div>
		{:else}
			<SearchInput placeholder="Find Item" bind:value={$searchStore.search} />
			<div class="flex items-center justify-between">
				<SortDropdown {sortOptions} bind:currentSort={$sort} />

				<!-- Only show groupby btn if collection properties includes a 'SELECT' or 'CHECKBOX' -->
				{#key properties}
					{#if view === 'list' && includesGroupableProperties()}
						<div>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild let:builder>
									<Button variant="secondary" builders={[builder]}>Group by</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content class="w-56">
									<DropdownMenu.Label>Group by</DropdownMenu.Label>
									<DropdownMenu.Separator />
									<DropdownMenu.RadioGroup
										value={collection.groupItemsBy || 'none'}
										onValueChange={(value) =>
											updCollection({ groupItemsBy: value !== 'none' ? value : null })}
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

				<ViewButtonsGroup bind:view>
					<ViewButton value="list">
						<StretchHorizontal class="icon-md" />
					</ViewButton>
					<ViewButton value="table">
						<Table class="icon-md" />
					</ViewButton>
				</ViewButtonsGroup>
			</div>
		{/if}

		{#if view === 'table' || !collection.groupItemsBy}
			<Items
				items={removeSearchTerms($searchStore.filtered)}
				{view}
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

		{#if view === 'list' && collection.groupItemsBy}
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
									{view}
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

		{#if $isDesktop}
			<div class="relative">
				<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
					<Plus class="text-primary" />
				</div>
				<input
					class="h-10 w-full pl-10 text-base font-semibold rounded bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
					placeholder="New item"
					on:keypress={handleKeypressNewItemInput}
				/>
			</div>
		{:else}
			<Button
				size="icon"
				class="fixed bottom-4  right-3 z-10"
				on:click={() => handleCreateItem('Untitled', true)}
			>
				<Plus />
			</Button>
		{/if}
	</PageContent>
</PageContainer>

<Sheet bind:open={isOpen} id="itemDrawer" class=" w-full lg:w-1/3 p-0 lg:p-1 lg:pl-0">
	<div class="h-full flex flex-col space-y-1.5 p-1 rounded-md bg-card">
		<div class="flex justify-between items-center">
			<Button
				variant="secondary"
				size="icon"
				on:click={() => {
					goto(`/collections/${collection.id}`);
					isOpen = false;
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

				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button builders={[builder]} variant="secondary" size="icon"><MoreHorizontal /></Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56">
						<DropdownMenu.Group>
							<DropdownMenu.Item
								class="space-x-2"
								on:click={() => duplicateItem($activeItem ? $activeItem.id : '')}
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
			</div>
		</div>

		<div class="grow flex flex-col space-y-4 overflow-y-auto">
			<h2
				id="item-name"
				contenteditable
				spellcheck={false}
				on:keypress={preventEnterKeypress}
				on:input={handleOnInputItemName}
				class="pt-1 text-2xl font-semibold focus:outline-none"
			>
				{$activeItem?.name}
			</h2>

			<div class="space-y-2">
				{#each properties as property}
					<PropertyInputWrapper
						{property}
						isCheckBox={property.type === 'CHECKBOX'}
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
		<div class="grid justify-items-start">
			<AddPropertyPopover on:clickPropType={({ detail }) => addProperty(detail)} />
		</div>
	</div>
</Sheet>

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
