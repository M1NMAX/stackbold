<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		ArchiveOutline,
		CirclePlusOutline,
		CloseOutline,
		ExclamationCircleOutline,
		EyeOutline,
		EyeSlashOutline,
		FileCopyOutline,
		FolderDuplicateOutline,
		HeartOutline,
		HeartSolid,
		PenOutline,
		TrashBinOutline,
		UserAddOutline
	} from 'flowbite-svelte-icons';
	import { Drawer, Modal } from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';

	import type { PageData } from './$types';
	import {
		type Item as ItemType,
		type ItemProperty as ItemPropertyType,
		PropertyType
	} from '@prisma/client';
	import {
		CollectionProperty,
		Dropdown,
		DropdownItem,
		DropdownDivider,
		IconBtn,
		ModalEditor
	} from '$lib/components';

	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';

	import toast from 'svelte-french-toast';
	import type { RouterInputs } from '$lib/trpc/router';
	import { DEFAULT_FEEDBACK_ERR_MESSAGE } from '$lib/constant';
	import Item from './Item.svelte';
	import {} from 'os';

	export let data: PageData;
	$: currCollection = data.collection;
	$: currItems = data.items;

	let busy = false;

	let selectedProperty: RouterInputs['collections']['updateProperty']['property'] | null = null;
	let drawerSelectedItem: ItemType | null = null;
	let itemName: string | null = null;

	let selectedItemId: string | null = null;

	const handleClickOpenItem = (itemId: string) => {
		isDrawerHidden = false;
		busy = true;
		const foundedItem = data.items.find((item) => item.id === itemId);
		drawerSelectedItem = foundedItem ? foundedItem : null;

		itemName = drawerSelectedItem && drawerSelectedItem.name;

		// item = await trpc().items.getItem(itemId)
	};

	const getPropValueById = (pid: string, itemProps: ItemPropertyType[]) => {
		const collectionProp = currCollection.properties.find((prop) => prop.id === pid);
		const itemProp = itemProps.find((property) => property.id === pid);

		if (!collectionProp || !itemProp) return '';

		if (collectionProp.type !== 'SELECT') return itemProp.value;

		const option = collectionProp.options.find((opt) => opt.id === itemProp.value);

		return option ? option.value : '';
	};

	let openEdit = false;
	// Drawer
	let isDrawerHidden = true;
	let activateClickOutside = false;
	let backdrop = false;
	let transitionParams = {
		x: 320,
		duration: 300,
		easing: sineIn
	};
	// Drawer

	// Delete Modal
	let isDeleteModalOpen = false;
	let isCollection = false;

	// Collection handlers
	const handleDeleteCollection = async () => {
		if (currCollection.ownerId !== data.user.userId) {
			toast.error('Unauthorized');
			return;
		}

		busy = true;
		await trpc().collections.delete.mutate(currCollection.id);
		await invalidateAll();
		isCollection = false;
		busy = false;
		goto('/collections');
		toast.success('Collection deleted');
	};

	const handleDuplicateCollection = async () => {
		const itemsCopy = data.items.map(({ id, collectionId, ...rest }) => ({
			...rest
		}));

		const { id, name, ownerId, ...rest } = data.collection;

		busy = true;
		const newCollection = await trpc().collections.create.mutate({
			...rest,
			name: name + ' copy',
			items: { create: itemsCopy }
		});
		await invalidateAll();
		busy = false;
		toast.success('Collection duplicated');
		goto(`/collections/${newCollection.id}`);
	};

	const handleUpdateCollection = async (detail: RouterInputs['collections']['update']['data']) => {
		busy = true;
		await trpc().collections.update.mutate({
			id: currCollection.id,
			data: detail
		});

		await invalidateAll();
		busy = false;
		toast.success('Collection updated successfully');
	};

	// Item handlers

	const handleDeleteItem = async () => {
		if (!selectedItemId) {
			toast.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
			return;
		}

		busy = true;

		await trpc().items.delete.mutate(selectedItemId);
		if (selectedItemId === drawerSelectedItem?.id) isDrawerHidden = true;
		await invalidateAll();
		busy = false;
		toast.success('item deleted');
	};

	const handleDuplicateItem = async (itemId: string) => {
		const item = currItems.find(({ id }) => id === itemId);
		if (!item) {
			toast.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
			return;
		}

		const { id, collectionId, updatedByUserId, name, ...rest } = item;

		busy = true;

		await trpc().items.create.mutate({
			collectionId,
			itemData: { ...rest, name: name + ' copy' }
		});
		isDrawerHidden = true;
		await invalidateAll();
		busy = false;
		toast.success('Item duplicated');
	};
	const handleUpdateItem = async (
		itemId: string,
		detail: RouterInputs['items']['update']['data']
	) => {
		busy = true;

		await trpc().items.update.mutate({
			id: itemId,
			data: detail
		});

		await invalidateAll();
		busy = false;
		toast.success('Item updated successfully');
	};

	// Property Handlers

	const propertyTypes = Object.values(PropertyType);

	const getProperty = (pid: string) =>
		currCollection.properties.find((prop) => prop.id === pid) || null;

	const handleEditProperty = (pid: string) => (selectedProperty = getProperty(pid));

	const handleDuplicateProperty = async (pid: string) => {
		const property = getProperty(pid);
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
			await invalidateAll();
			toast.success('Property duplicated');
		} catch (error) {
			console.log(error);
			toast.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
		}
	};
	const handleDeleteProperty = async (pid: string) => {
		try {
			await trpc().collections.deleteProperty.mutate({ id: currCollection.id, propertyId: pid });

			await trpc().items.deleteProperty.mutate({
				ids: currItems.map(({ id }) => id),
				propertyId: pid
			});

			await invalidateAll();
			toast.success('Property removed');
		} catch (err) {
			console.log(err);
			toast.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
		}
	};

	const handleAddProperty = async () => {
		try {
			const updatedCollectionData = await trpc().collections.addProperty.mutate({
				id: currCollection.id,
				property: { name: PropertyType.TEXT.toString(), type: PropertyType.TEXT }
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
			await invalidateAll();
			toast.success('Property Added');
		} catch (error) {
			console.log(error);
			toast.error(DEFAULT_FEEDBACK_ERR_MESSAGE);
		}
	};
</script>

<svelte:head>
	<title>{currCollection.name}</title>
</svelte:head>

<div
	class={`${
		!isDrawerHidden ? 'w-3/6' : 'w-5/6'
	} ease-in-out duration-300 m-2 ml-0 p-2 rounded-md bg-gray-50`}
>
	<div class="flex items-center space-x-1.5 p-1">
		<h1 class="grow font-semibold text-2xl">
			{currCollection.name}
		</h1>
		<IconBtn on:click={handleDuplicateCollection}>
			<UserAddOutline />
		</IconBtn>

		<IconBtn on:click={() => handleUpdateCollection({ isFavourite: !currCollection.isFavourite })}>
			{#if currCollection.isFavourite}
				<HeartSolid class="text-red-500" />
			{:else}
				<HeartOutline />
			{/if}
		</IconBtn>

		<Dropdown>
			<IconBtn slot="button">
				<AdjustmentsHorizontalOutline />
			</IconBtn>
			<svelte:fragment>
				<DropdownItem
					on:click={() => handleUpdateCollection({ isDescHidden: !currCollection.isDescHidden })}
				>
					{#if currCollection.isDescHidden}
						<EyeOutline />
						<span> Show description </span>
					{:else}
						<EyeSlashOutline />
						<span> Hide description </span>
					{/if}
				</DropdownItem>

				<DropdownItem>
					<PenOutline />
					<span> Rename </span>
				</DropdownItem>

				<DropdownItem on:click={handleDuplicateCollection}>
					<FolderDuplicateOutline />
					<span> Duplicate </span>
				</DropdownItem>

				<DropdownItem on:click={() => handleUpdateCollection({ isArchived: true })}>
					<ArchiveOutline />
					<span> Archive </span>
				</DropdownItem>
				<DropdownDivider />

				<DropdownItem
					on:click={() => {
						isCollection = true;
						isDeleteModalOpen = true;
					}}
					class="dropdown-item-red"
				>
					<TrashBinOutline />
					<span> Delete </span>
				</DropdownItem>
			</svelte:fragment>
		</Dropdown>
	</div>

	<div>
		{currCollection.description}
	</div>

	<div class="space-y-2 p-1">
		{#each data.items as item}
			<Item
				{item}
				active={drawerSelectedItem ? drawerSelectedItem.id === item.id : false}
				collectionProperties={currCollection.properties}
				on:clickOpen={() => handleClickOpenItem(item.id)}
				on:clickHide={() => handleUpdateItem(item.id, { isHidden: true })}
				on:clickDuplicate={() => handleDuplicateItem(item.id)}
				on:clickDelete={() => {
					isDeleteModalOpen = true;
					selectedItemId = item.id;
				}}
			/>
		{/each}
	</div>
</div>

<Drawer
	{activateClickOutside}
	{backdrop}
	placement="right"
	transitionType="fly"
	{transitionParams}
	bind:hidden={isDrawerHidden}
	id="itemDrawer"
	class="w-full xl:w-2/6 p-2 bg-gray-200"
>
	<div class="h-full rounded-md bg-gray-50 p-3">
		<div class="flex justify-between items-center">
			<IconBtn on:click={() => (isDrawerHidden = true)}>
				<CloseOutline size="sm" />
			</IconBtn>

			<Dropdown>
				<IconBtn slot="button">
					<AdjustmentsHorizontalOutline />
				</IconBtn>
				<svelte:fragment>
					<DropdownItem on:click={() => handleAddProperty()}>
						<CirclePlusOutline />
						<span> Add property </span>
					</DropdownItem>

					<DropdownItem
						on:click={() =>
							handleUpdateItem(drawerSelectedItem ? drawerSelectedItem.id : '', { isHidden: true })}
					>
						<EyeSlashOutline />
						<span> Hide item </span>
					</DropdownItem>

					<DropdownItem
						on:click={() => handleDuplicateItem(drawerSelectedItem ? drawerSelectedItem.id : '')}
					>
						<FileCopyOutline />
						<span> Duplicate </span>
					</DropdownItem>

					<DropdownDivider />
					<DropdownItem
						on:click={() => {
							isDeleteModalOpen = true;
							selectedItemId = drawerSelectedItem && drawerSelectedItem.id;
						}}
						class=" dropdown-item-red"
					>
						<TrashBinOutline />
						<span> Delete </span>
					</DropdownItem>
				</svelte:fragment>
			</Dropdown>
		</div>

		<div class="flex flex-col space-y-1 rounded bg-gray-200 p-1 my-4">
			<!-- <Label class=" grow truncate font-semibold">Name</Label> -->
			<input
				type="text"
				value={itemName}
				class="input input-sm input-ghost font-medium bg-gray-200"
			/>
		</div>

		<div class="flex flex-col space-y-4">
			{#each currCollection.properties as property}
				<CollectionProperty
					{property}
					value={getPropValueById(
						property.id,
						drawerSelectedItem ? drawerSelectedItem.properties : []
					)}
					on:edit={(e) => handleEditProperty(e.detail)}
					on:duplicate={(e) => handleDuplicateProperty(e.detail)}
					on:delete={(e) => handleDeleteProperty(e.detail)}
				/>
			{/each}
		</div>
	</div>
</Drawer>

<ModalEditor
	item={selectedProperty}
	itemName="Property"
	on:cancel={() => (selectedProperty = null)}
>
	<div class="form-control">
		<label class="label flex flex-col items-start space-y-2">
			<span class="label-text">Name</span>
			<input type="text" class="input input-sm input-ghost" value={selectedProperty?.name} />
		</label>
	</div>

	<div class="form-control">
		<label class="label flex flex-col items-start space-y-2">
			<span class="label-text">Type</span>

			<select class="select select-sm select-ghost" value={selectedProperty?.type}>
				<option disabled selected>Pick one</option>

				{#each propertyTypes as propType}
					<option value={propType}>
						{propType.charAt(0) + propType.slice(1).toLowerCase()}
					</option>
				{/each}
			</select>
		</label>
	</div>
</ModalEditor>

<Modal bind:open={isDeleteModalOpen} size="xs" autoclose>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to delete this {#if isCollection}
				collection
			{:else}
				item
			{/if} ?
		</h3>
		{#if isCollection}
			<button on:click={handleDeleteCollection} class="btn btn-error btn-sm">Yes, I'm sure</button>
		{:else}
			<button on:click={handleDeleteItem} class="btn btn-error btn-sm">Yes, I'm sure</button>
		{/if}
		<button class="btn btn-sm">No, cancel</button>
	</div>
</Modal>
