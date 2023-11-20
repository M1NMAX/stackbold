<script lang="ts">
	import {
		Archive,
		Copy,
		Eye,
		EyeOff,
		Folder,
		Heart,
		HeartOff,
		Menu,
		MoreHorizontal,
		Pencil,
		Plus,
		Trash,
		UserPlus,
		X
	} from 'lucide-svelte';

	import { sineIn } from 'svelte/easing';
	import type { PageData } from './$types';
	import {
		type ItemProperty as ItemPropertyType,
		type Item as ItemType,
		PropertyType,
		type Collection,
		type CollectionProperty as CollectionPropertyType
	} from '@prisma/client';
	import {
		CollectionProperty,
		CollectionPropertyOptions,
		CollectionPropertyInputWrapper,
		Items,
		Textarea
	} from '$lib/components';
	import debounce from 'debounce';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import toast from 'svelte-french-toast';
	import type { RouterInputs } from '$lib/trpc/router';
	import { DEFAULT_DEBOUNCE_INTERVAL, DEFAULT_FEEDBACK_ERR_MESSAGE } from '$lib/constant';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import { getContext } from 'svelte';
	import dayjs from '$lib/utils/dayjs';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Drawer } from '$lib/components/ui/drawer';

	export let data: PageData;

	$: currCollection = data.collection;
	$: currItems = data.items;

	let isSheetOpen = false;

	let isPropertyDialogOpen = false;
	const sidebarState = getContext<Writable<boolean>>('sidebarStateStore');
	let selectedProperty: CollectionPropertyType | null = null;
	let drawerSelectedItem: ItemType | null = null;
	let selectedItemId: string | null = null;

	// View
	let currView = 'list';

	// Drawer
	let isDrawerHidden = true;

	let transitionParams = {
		x: 320,
		duration: 300,
		easing: sineIn
	};

	// Delete Modal
	let isDeleteModalOpen = false;

	type noElement = {
		type: null;
	};

	type selectElement = {
		type: 'collection' | 'item' | 'property';
		id: string;
	};

	type selectedOption = {
		type: 'option';
		id: string;
		option: string;
	};

	let elementToBeDelete: noElement | selectElement | selectedOption = { type: null };

	$: handleOnClickModalDeleteBtn = () => {
		switch (elementToBeDelete.type) {
			case 'collection':
				handleDeleteCollection();
				break;

			case 'item':
				handleDeleteItem();
				break;

			case 'property':
				handleDeleteProperty(elementToBeDelete.id);
				break;

			case 'option':
				handleDeletePropertyOption(elementToBeDelete.id, elementToBeDelete.option);
				break;

			default:
				break;
		}
		isDeleteModalOpen = false;
	};

	// Feedback
	const onSuccess = async (msg: string) => {
		await invalidateAll();
		toast.success(msg);
	};

	const onError = async (error: unknown, msg: string | null = null) => {
		console.log(error);
		toast.error(msg ? msg : DEFAULT_FEEDBACK_ERR_MESSAGE);
	};

	const preventEnterKeypress = (e: KeyboardEvent) => {
		if (e.key == 'Enter') e.preventDefault();
	};

	const handleClickOpenItem = async (itemId: string) => {
		isDrawerHidden = false;
		drawerSelectedItem = data.items.find((item) => item.id === itemId) || null;

		// drawerSelectedItem = await trpc().items.load.query(itemId);
	};

	// Collection handlers
	const handleDeleteCollection = async () => {
		if (currCollection.ownerId !== data.user.userId) {
			toast.error('Unauthorized');
			return;
		}

		try {
			await trpc().collections.delete.mutate(currCollection.id);
			await invalidateAll();

			goto('/collections');
			toast.success('Collection deleted');
		} catch (error) {
			onError(error);
		}
	};

	const handleDuplicateCollection = async () => {
		const itemsCopy = data.items.map(({ id, collectionId, ...rest }) => ({
			...rest
		}));

		const { id, name, ownerId, ...rest } = data.collection;

		const newCollection = await trpc().collections.create.mutate({
			...rest,
			name: name + ' copy',
			items: { create: itemsCopy }
		});

		onSuccess('Collection duplicated');
		goto(`/collections/${newCollection.id}`);
	};

	const handleUpdateCollection = async (detail: RouterInputs['collections']['update']['data']) => {
		await trpc().collections.update.mutate({
			id: currCollection.id,
			data: detail
		});

		onSuccess('Collection updated successfully');
	};

	const debouncedCollectionUpdate = debounce(handleUpdateCollection, DEFAULT_DEBOUNCE_INTERVAL);

	const handleOnInputCollectionName = async (e: {
		currentTarget: EventTarget & HTMLHeadingElement;
	}) => {
		const collectionName = e.currentTarget.innerText;
		debouncedCollectionUpdate({ name: collectionName });
	};

	const handleOnInputCollectionDesc = async (e: Event) => {
		const targetEl = e.target as HTMLTextAreaElement;

		debouncedCollectionUpdate({ description: targetEl.value });
	};

	// Item handlers
	const handleDeleteItem = async () => {
		if (!selectedItemId) {
			toast.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
			return;
		}

		await trpc().items.delete.mutate(selectedItemId);
		if (selectedItemId === drawerSelectedItem?.id) isDrawerHidden = true;
		await onSuccess('item deleted');
	};

	const handleDuplicateItem = async (itemId: string) => {
		const item = currItems.find(({ id }) => id === itemId);
		if (!item) {
			toast.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
			return;
		}

		const { id, collectionId, updatedByUserId, name, ...rest } = item;

		await trpc().items.create.mutate({
			collectionId,
			itemData: { ...rest, name: name + ' copy' }
		});
		isDrawerHidden = true;
		onSuccess('Item duplicated');
	};

	const handleUpdateItem = async (args: RouterInputs['items']['update']) => {
		try {
			await trpc().items.update.mutate(args);

			await onSuccess('Item updated successfully');
		} catch (error) {
			onError(error);
		}
	};

	const debounceItemUpdate = debounce(handleUpdateItem, DEFAULT_DEBOUNCE_INTERVAL);

	const handleOnInputItemName = async (e: { currentTarget: EventTarget & HTMLHeadingElement }) => {
		if (!drawerSelectedItem) return;
		const id = drawerSelectedItem.id;

		//TODO:valide inner text
		const name = e.currentTarget.innerText;

		debounceItemUpdate({ id, data: { name } });
	};
	const handleItemNameChange = async (e: Event) => {
		const input = e.target as HTMLTextAreaElement;

		if (!drawerSelectedItem) return;

		const id = drawerSelectedItem.id;

		debounceItemUpdate({ id, data: { name: input.value } });
	};

	const handleCreateItem = async (name: string, openDrawer: boolean = false) => {
		try {
			//TODO: in the future, property may have default value
			const createItem = await trpc().items.create.mutate({
				collectionId: currCollection.id,
				itemData: {
					name,
					properties: currCollection.properties.map((prop) => ({
						id: prop.id,
						value: prop.type === 'CHECKBOX' ? 'false' : ''
					}))
				}
			});
			await onSuccess('New item add successfully');

			if (openDrawer) {
				drawerSelectedItem = createItem;
				isDrawerHidden = false;
			}
		} catch (error) {
			onError(error);
		}
	};

	const handleKeypressNewItemInput = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			const targetEl = e.target as HTMLInputElement;
			const value = targetEl.value;
			//TODO: better validation
			if (value.length >= 1 && value.length < 255) {
				handleCreateItem(value);
				targetEl.value = '';
			}
		}
	};

	// Property Handlers
	const propertyTypes = Object.values(PropertyType);

	const getProperty = (collection: Collection, pid: string) =>
		collection.properties.find((prop) => prop.id === pid) || null;

	const getItemPropValue = (pid: string, itemProps: ItemPropertyType[]) => {
		const collectionProp = currCollection.properties.find((prop) => prop.id === pid);
		const itemProp = itemProps.find((property) => property.id === pid);

		if (!collectionProp || !itemProp) return '';

		if (collectionProp.type !== 'SELECT') return itemProp.value;

		const option = collectionProp.options.find((opt) => opt.id === itemProp.value);

		return option ? option.id : '';
	};

	const handleEditProperty = (pid: string) => {
		isPropertyDialogOpen = true;
		selectedProperty = getProperty(currCollection, pid);
	};

	const handleDuplicateProperty = async (pid: string) => {
		const property = getProperty(currCollection, pid);
		if (!property) {
			toast.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
			return;
		}

		try {
			const { id, name, createdAt, ...rest } = property;

			const updatedCollectionData = await trpc().collections.addProperty.mutate({
				id: currCollection.id,
				property: { ...rest, name: name + ' copy' }
			});

			const updatedProperties = updatedCollectionData.properties;

			const lastProperty = updatedProperties[updatedProperties.length - 1];

			await trpc().items.addProperty.mutate({
				ids: currItems.map(({ id }) => id),
				property: {
					id: lastProperty.id,
					value: ''
				}
			});
			await onSuccess('Property duplicated');
		} catch (error) {
			onError(error);
		}
	};

	const handleDeleteProperty = async (pid: string) => {
		try {
			await trpc().collections.deleteProperty.mutate({ id: currCollection.id, propertyId: pid });

			await trpc().items.deleteProperty.mutate({
				ids: currItems.map(({ id }) => id),
				propertyId: pid
			});

			await onSuccess('Property removed');
		} catch (error) {
			onError(error);
		}
	};

	const handleAddProperty = async () => {
		try {
			const updatedCollectionData = await trpc().collections.addProperty.mutate({
				id: currCollection.id,
				property: {
					name: capitalizeFirstLetter(PropertyType.TEXT.toString()),
					type: PropertyType.TEXT
				}
			});

			const updatedProperties = updatedCollectionData.properties;

			const lastProperty = updatedProperties[updatedProperties.length - 1];

			await trpc().items.addProperty.mutate({
				ids: currItems.map(({ id }) => id),
				property: {
					id: lastProperty.id,
					value: ''
				}
			});
			await onSuccess('Property Added');
		} catch (error) {
			onError(error);
		}
	};

	const handleUpdateProperty = debounce(
		async (property: RouterInputs['collections']['updateProperty']['property']) => {
			try {
				const updatedCollectionData = await trpc().collections.updateProperty.mutate({
					id: currCollection.id,
					property
				});

				selectedProperty = getProperty(updatedCollectionData, property.id);

				await onSuccess('Property update');
			} catch (error) {
				onError(error);
			}
		},
		DEFAULT_DEBOUNCE_INTERVAL
	);

	const handleOnInputPropertyField = (e: Event) => {
		//TODO: correct item value when property change
		const input = e.target as HTMLInputElement;

		const { id, name, value } = input;

		const data: { [key: string]: string } = {};

		data[name] = value;

		handleUpdateProperty({ id, ...data });
	};

	const handleAddPropertyOption = async (pid: string, value: string) => {
		try {
			const updatedCollection = await trpc().collections.addPropertyOption.mutate({
				id: currCollection.id,
				property: { id: pid, option: { value } }
			});

			selectedProperty = getProperty(updatedCollection, pid);

			await onSuccess('Property Option added ');
		} catch (error) {
			onError(error);
		}
	};

	const debouncedUpdatePropertyOption = debounce(
		async (args: RouterInputs['collections']['updatePropertyOption']) => {
			try {
				await trpc().collections.updatePropertyOption.mutate(args);
				await onSuccess('Property Option added');
			} catch (error) {
				onError(error);
			}
		},
		DEFAULT_DEBOUNCE_INTERVAL
	);

	const handleUpdatePropertyOption = (
		pid: string,
		option: RouterInputs['collections']['updatePropertyOption']['property']['option']
	) => {
		debouncedUpdatePropertyOption({ id: currCollection.id, property: { id: pid, option } });
	};

	const handleDeletePropertyOption = async (pid: string, optionId: string) => {
		try {
			const updatedCollection = await trpc().collections.deletePropertyOption.mutate({
				id: currCollection.id,
				property: { id: pid, optionId }
			});
			selectedProperty = updatedCollection.properties.find((prop) => prop.id === pid) || null;

			await onSuccess('Property Option deleted ');
		} catch (error) {
			onError(error);
		}
	};

	const handleUpdatePropertyValue = debounce(
		async (id: string, property: { id: string; value: string }) => {
			try {
				drawerSelectedItem = await trpc().items.updateProperty.mutate({ id, property });
				await invalidateAll();
				toast.success('Property Value updated');
			} catch (error) {
				onError(error);
			}
		},
		DEFAULT_DEBOUNCE_INTERVAL
	);
</script>

<svelte:head>
	<title>{currCollection.name}</title>
</svelte:head>

<div
	class={`${
		!isDrawerHidden ? 'w-2/3' : 'w-full'
	}  ease-in-out duration-300  p-1 rounded-md bg-gray-50 flex flex-col space-y-3.5 overflow-hidden`}
>
	<div class="flex items-center space-x-1.5">
		{#if !$sidebarState}
			<Button variant="outline" size="icon" on:click={() => ($sidebarState = true)}>
				<Menu class="w-6 h-6" />
			</Button>
		{/if}

		<Folder class="w-6 h-6" />
		<h1
			class="grow font-semibold text-2xl focus:outline-none"
			contenteditable
			spellcheck={false}
			on:keypress={preventEnterKeypress}
			on:input={handleOnInputCollectionName}
		>
			{currCollection.name}
		</h1>

		<span class="font-semibold text-xs text-gray-500 mr-2">
			Updated
			{dayjs(currCollection.updatedAt).fromNow()}
		</span>

		<Button variant="secondary" size="icon">
			<UserPlus />
		</Button>

		<Button
			variant="outline"
			size="icon"
			on:click={() => handleUpdateCollection({ isFavourite: !currCollection.isFavourite })}
		>
			{#if currCollection.isFavourite}
				<Heart class="text-primary" />
			{:else}
				<HeartOff />
			{/if}
		</Button>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="outline" size="icon"><MoreHorizontal /></Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-56">
				<DropdownMenu.Group>
					<DropdownMenu.Item
						on:click={() => handleUpdateCollection({ isDescHidden: !currCollection.isDescHidden })}
					>
						{#if currCollection.isDescHidden}
							<Eye class="mr-2 h-4 w-4" />
							<span> Show description </span>
						{:else}
							<EyeOff class="mr-2 h-4 w-4" />
							<span> Hide description </span>
						{/if}
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<Pencil class="mr-2 h-4 w-4" />
						<span>Rename</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={handleDuplicateCollection}>
						<Copy class="mr-2 h-4 w-4" />
						<span>Duplicate</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => handleUpdateCollection({ isArchived: true })}>
						<Archive class="mr-2 h-4 w-4" />
						<span>Archive</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item
						on:click={() => {
							elementToBeDelete = { id: currCollection.id, type: 'collection' };
							isDeleteModalOpen = true;
						}}
					>
						<Trash class="mr-2 h-4 w-4" />
						<span>Delete</span>
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	{#if !currCollection.isDescHidden}
		<label transition:fade for="description" class="label p-1 mt-1.5">
			<span class="sr-only label-text"> Collection description</span>
			<Textarea
				id="description"
				value={currCollection.description}
				on:input={handleOnInputCollectionDesc}
				spellcheck={false}
				class="w-full textarea textarea-ghost text-base"
			/>
		</label>
	{/if}

	<!-- //TODO: impl rename item -->
	<Items
		onClickNewItemBtn={() => handleCreateItem('untitle item', true)}
		currActiveItemId={drawerSelectedItem ? drawerSelectedItem.id : undefined}
		items={data.items}
		bind:view={currView}
		collectionProperties={currCollection.properties}
		on:clickOpenItem={(e) => handleClickOpenItem(e.detail)}
		on:clickRename={(e) => handleUpdateItem({ id: e.detail, data: { name: 'something' } })}
		on:clickDuplicateItem={(e) => handleDuplicateItem(e.detail)}
		on:clickDeleteItem={(e) => {
			elementToBeDelete = { id: e.detail, type: 'item' };
			isDeleteModalOpen = true;
			selectedItemId = e.detail;
		}}
		on:updPropertyValue={(e) => {
			handleUpdatePropertyValue(e.detail.itemId, {
				id: e.detail.property.id,
				value: e.detail.property.value
			});
		}}
	/>

	<div class="relative">
		<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
			<Plus class="text-primary" />
		</div>
		<input
			class="w-full h-10 pl-10 text-base font-semibold rounded bg-base-300 placeholder:text-primary focus:outline-none focus:placeholder:text-gray-800"
			placeholder="Add new item"
			on:keypress={handleKeypressNewItemInput}
		/>
	</div>
</div>

<Drawer
	activateClickOutside={false}
	backdrop={false}
	placement="right"
	transitionType="fly"
	{transitionParams}
	bind:hidden={isDrawerHidden}
	id="itemDrawer"
	class="absolute w-full lg:w-1/3 p-0 pl-1  bg-gray-200"
>
	<div class="h-full flex flex-col space-y-1.5 rounded-md bg-gray-50 p-1">
		<div class="flex justify-between items-center">
			<Button
				variant="outline"
				size="icon"
				on:click={() => {
					isDrawerHidden = true;
					drawerSelectedItem = null;
				}}
			>
				<X />
			</Button>

			<div class="flex items-center space-x-1.5">
				{#if drawerSelectedItem}
					<span class="font-semibold text-xs text-gray-500">
						Updated
						{dayjs(drawerSelectedItem?.updatedAt).fromNow()}
					</span>
				{/if}

				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button builders={[builder]} variant="outline" size="icon"><MoreHorizontal /></Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56">
						<DropdownMenu.Group>
							<!-- TODO: Implement rename -->
							<DropdownMenu.Item
								class="space-x-2"
								on:click={() =>
									handleUpdateItem({
										id: drawerSelectedItem ? drawerSelectedItem.id : '',
										data: { name: 'something' }
									})}
							>
								<Pencil class="icon-xs" />
								<span> Rename </span>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								class="space-x-2"
								on:click={() =>
									handleDuplicateItem(drawerSelectedItem ? drawerSelectedItem.id : '')}
							>
								<Copy class="icon-xs" />
								<span>Duplicate</span>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								class="space-x-2"
								on:click={() => {
									if (!drawerSelectedItem) return;

									elementToBeDelete = { id: drawerSelectedItem.id, type: 'item' };
									isDeleteModalOpen = true;

									selectedItemId = drawerSelectedItem && drawerSelectedItem.id;
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

		<div class="grow flex flex-col space-y-4">
			<h2
				contenteditable
				spellcheck={false}
				on:keypress={preventEnterKeypress}
				on:input={handleOnInputItemName}
				class="pt-1 text-2xl font-semibold focus:outline-none"
			>
				{drawerSelectedItem?.name}
			</h2>

			<div class="space-y-2">
				{#each currCollection.properties as property}
					<CollectionProperty
						{property}
						value={getItemPropValue(
							property.id,
							drawerSelectedItem ? drawerSelectedItem.properties : []
						)}
						on:updPropertyValue={(e) => {
							if (!drawerSelectedItem) return;

							handleUpdatePropertyValue(drawerSelectedItem.id, {
								id: e.detail.pid,
								value: e.detail.value
							});
						}}
						on:edit={(e) => handleEditProperty(e.detail)}
						on:duplicate={(e) => handleDuplicateProperty(e.detail)}
						on:delete={(e) => {
							elementToBeDelete = { id: e.detail, type: 'property' };

							isDeleteModalOpen = true;
						}}
					/>
				{/each}
			</div>
		</div>
		<div class="grid justify-items-end">
			<Button variant="secondary" on:click={() => handleAddProperty()} class="space-x-2">
				<Plus class="w-4 h-4" />
				<span> Add a property </span>
			</Button>
		</div>
	</div>
</Drawer>

<Dialog.Root bind:open={isPropertyDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Property</Dialog.Title>
		</Dialog.Header>
		<form class="space-y-1">
			<CollectionPropertyInputWrapper name="Name">
				<input
					id={selectedProperty?.id}
					value={selectedProperty?.name}
					on:input={handleOnInputPropertyField}
					name="name"
					class="input input-sm input-ghost font-semibold text-sm bg-base-200 col-span-9"
				/>
			</CollectionPropertyInputWrapper>

			<CollectionPropertyInputWrapper name="Type">
				<select
					id={selectedProperty?.id}
					name="type"
					value={selectedProperty?.type}
					on:input={handleOnInputPropertyField}
					class="select select-sm select-ghost font-semibold text-sm bg-base-200 col-span-9"
				>
					{#each propertyTypes as propertyType}
						<option value={propertyType}>
							{capitalizeFirstLetter(propertyType)}
						</option>
					{/each}
				</select>
			</CollectionPropertyInputWrapper>

			{#if selectedProperty && selectedProperty.type === 'SELECT' && selectedProperty.options}
				<CollectionPropertyOptions
					propertyId={selectedProperty.id}
					options={selectedProperty.options}
					on:addOpt={({ detail }) => handleAddPropertyOption(detail.propertyId, detail.value)}
					on:updOptColor={({ detail }) => {
						handleUpdatePropertyOption(detail.propertyId, {
							id: detail.optionId,
							color: detail.color
						});
					}}
					on:updOptValue={({ detail }) => {
						handleUpdatePropertyOption(detail.propertyId, {
							id: detail.optionId,
							value: detail.value
						});
					}}
					on:deleteOpt={({ detail }) => {
						elementToBeDelete = {
							id: detail.propertyId,
							option: detail.optionId,
							type: 'option'
						};
						isDeleteModalOpen = true;
					}}
				/>
			{/if}
		</form>
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={isDeleteModalOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete</AlertDialog.Title>
			<AlertDialog.Description class="text-lg">
				Are you sure you want to delete this {elementToBeDelete.type} ?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
