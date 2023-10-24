<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		ArchiveOutline,
		CirclePlusOutline,
		CloseOutline,
		ExclamationCircleOutline,
		EyeOutline,
		EyeSlashOutline,
		FolderDuplicateOutline,
		HeartOutline,
		HeartSolid,
		PenOutline,
		TrashBinOutline,
		UserAddOutline,
		WindowOutline
	} from 'flowbite-svelte-icons';
	import { Drawer, Input, Modal } from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';

	import type { PageData } from './$types';
	import type { Item, ItemProperty as ItemPropertyType } from '@prisma/client';
	import {
		CollectionProperty,
		Dropdown,
		DropdownItem,
		DropdownDivider,
		IconBtn,
		ItemProperty
	} from '$lib/components';

	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';

	import toast from 'svelte-french-toast';
	import type { Color } from '$lib/types';
	import type { RouterInputs } from '$lib/trpc/router';
	import { DEFAULT_FEEDBACK_ERR_MESSAGE } from '$lib/constant';

	export let data: PageData;
	$: currCollection = data.collection;
	$: currItems = data.items;

	const defaultPropColor = 'gray';
	let busy = false;
	let drawerSelectedItem: Item | null = null;
	let itemName: string | null = null;

	let selectedItemId: string | null = null;

	const handleOnClickItem = (itemId: string) => {
		hidden = false;
		busy = true;
		const foundedItem = data.items.find((item) => item.id === itemId);
		drawerSelectedItem = foundedItem ? foundedItem : null;

		itemName = drawerSelectedItem && drawerSelectedItem.name;

		// item = await trpc().items.getItem(itemId)
	};

	const getPropValueById = (pid: string, itemProps: ItemPropertyType[]) => {
		const property = itemProps.find((property) => property.id === pid);
		if (!property) return '';
		return property.value;
	};

	const getOptionColor = (pid: string, value: string) => {
		const property = data.collection.properties.find((prop) => prop.id === pid);
		if (!property) return defaultPropColor;

		const option = property.options.find((opt) => opt.value === value);

		if (!option) return defaultPropColor;
		return option.color.toLowerCase() as Color;
	};

	// Drawer
	let hidden = true;
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
		const itemsCopy = data.items.map(({ id, collectionId, ...otherItemData }) => ({
			...otherItemData
		}));

		const { id, name, ownerId, ...otherCollectionData } = data.collection;

		busy = true;
		const newCollection = await trpc().collections.create.mutate({
			name: name + ' copy',
			...otherCollectionData,
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
		if (selectedItemId === drawerSelectedItem?.id) hidden = true;
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
		hidden = true;
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
</script>

<svelte:head>
	<title>{currCollection.name}</title>
</svelte:head>

<div
	class={`${
		!hidden ? 'w-3/6' : 'w-5/6'
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
				<HeartSolid class="text-primary-700" />
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
			<div
				class={` ${
					drawerSelectedItem && drawerSelectedItem.id === item.id
						? 'rounded-l-md bg-gray-100 border-r-4 border-primary-600'
						: ' rounded  bg-gray-100 '
				} flex flex-col items-start  py-1 px-2 space-y-2 group`}
			>
				<div class="w-full flex justify-between items-center space-x-2">
					<span class="grow text-lg font-semibold">{item.name}</span>

					<Dropdown>
						<IconBtn slot="button" class="invisible group-hover:visible">
							<AdjustmentsHorizontalOutline />
						</IconBtn>

						<svelte:fragment>
							<DropdownItem>
								<PenOutline />
								<span> Rename item </span>
							</DropdownItem>

							<DropdownItem on:click={() => handleDuplicateItem(item.id)}>
								<FolderDuplicateOutline />
								<span> Duplicate </span>
							</DropdownItem>
							<DropdownDivider />
							<DropdownItem
								on:click={() => {
									isDeleteModalOpen = true;
									selectedItemId = item.id;
								}}
								class=" dropdown-item-red"
							>
								<TrashBinOutline />
								<span> Delete </span>
							</DropdownItem>
						</svelte:fragment>
					</Dropdown>

					<IconBtn
						on:click={() => handleOnClickItem(item.id)}
						class="invisible group-hover:visible"
					>
						<WindowOutline class="rotate-90" />
					</IconBtn>
				</div>

				<div class="flex flex-wrap gap-2">
					{#each currCollection.properties as prop}
						<ItemProperty
							name={prop.name}
							color={prop.type === 'SELECT'
								? getOptionColor(prop.id, getPropValueById(prop.id, item.properties))
								: defaultPropColor}
							type={prop.type}
							value={getPropValueById(prop.id, item.properties)}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<Drawer
	{activateClickOutside}
	{backdrop}
	placement="right"
	transitionType="fly"
	{transitionParams}
	bind:hidden
	id="itemDrawer"
	class="w-full xl:w-2/6 p-2 bg-gray-200"
>
	<div class="h-full rounded-md bg-gray-50 p-3">
		<div class="flex justify-between items-center">
			<IconBtn on:click={() => (hidden = true)} class="p-4">
				<CloseOutline />
			</IconBtn>

			<Dropdown>
				<IconBtn slot="button">
					<AdjustmentsHorizontalOutline />
				</IconBtn>
				<svelte:fragment>
					<DropdownItem>
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
						<FolderDuplicateOutline />
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
			<Input type="text" value={itemName} class=" rounded-sm text-lg border-none bg-gray-200 " />
		</div>

		<div class="flex flex-col space-y-4">
			{#each currCollection.properties as property}
				<CollectionProperty
					{property}
					value={getPropValueById(
						property.id,
						drawerSelectedItem ? drawerSelectedItem.properties : []
					)}
				/>
			{/each}
		</div>
	</div>
</Drawer>

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
