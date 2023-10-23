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
	import { Button, Drawer, Input, Modal } from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';

	import type { PageData } from './$types';
	import type { Item, ItemProperty as ItemPropertyType } from '@prisma/client';
	import { CollectionProperty, IconBtn, ItemProperty } from '$lib/components';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';

	import toast from 'svelte-french-toast';
	import type { Color } from '$lib/types';
	import type { RouterInputs } from '$lib/trpc/router';

	export let data: PageData;

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

	const handleDeleteItem = async () => {
		if (!selectedItemId) {
			toast.error('Something went wrong :(, try again');
			return;
		}

		busy = true;

		await trpc().items.deleteItem.mutate(selectedItemId);
		if (selectedItemId === drawerSelectedItem?.id) hidden = true;
		await invalidateAll();
		busy = false;
		toast.success('item deleted');
	};

	const handleDeleteCollection = async () => {
		if (data.collection.ownerId !== data.user.userId) {
			toast.error('Unauthorized');
			return;
		}

		busy = true;
		await trpc().collections.deleteCollection.mutate(data.collection.id);
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
		const newCollection = await trpc().collections.createCollection.mutate({
			name: name + ' copy',
			...otherCollectionData,
			items: { create: itemsCopy }
		});
		await invalidateAll();
		busy = false;
		toast.success('Collection duplicated');
		goto(`/collections/${newCollection.id}`);
	};

	const handleUpdateCollection = async (
		detail: RouterInputs['collections']['updateCollection']['data']
	) => {
		busy = true;
		await trpc().collections.updateCollection.mutate({
			id: data.collection.id,
			data: detail
		});

		await invalidateAll();
		busy = false;
		toast.success('Collection updated successfully');
	};
</script>

<svelte:head>
	<title>{data.collection.name}</title>
</svelte:head>

<div
	class={`${
		!hidden ? 'w-3/6' : 'w-5/6'
	} ease-in-out duration-300 m-2 ml-0 p-2 rounded-md bg-gray-50`}
>
	<div class="flex items-center space-x-1.5 p-1">
		<h1 class="grow font-semibold text-2xl">
			{data.collection.name}
		</h1>
		<IconBtn on:click={handleDuplicateCollection}>
			<UserAddOutline />
		</IconBtn>

		<IconBtn on:click={() => handleUpdateCollection({ isFavourite: !data.collection.isFavourite })}>
			{#if data.collection.isFavourite}
				<HeartSolid class="text-primary-700" />
			{:else}
				<HeartOutline />
			{/if}
		</IconBtn>

		<div class="dropdown dropdown-end">
			<IconBtn>
				<AdjustmentsHorizontalOutline />
			</IconBtn>

			<ul class="dropdown-content z-[1] menu w-56">
				<li>
					<button
						class="dropdown-item"
						on:click={() => handleUpdateCollection({ isDescHidden: !data.collection.isDescHidden })}
					>
						{#if data.collection.isDescHidden}
							<EyeOutline />
							<span> Show description </span>
						{:else}
							<EyeSlashOutline />
							<span> Hide description </span>
						{/if}
					</button>
				</li>
				<li>
					<button class="dropdown-item" on:click={() => handleUpdateCollection({ name: 'chuve' })}>
						<PenOutline />
						<span> Rename </span>
					</button>
				</li>
				<li>
					<button class="dropdown-item" on:click={handleDuplicateCollection}>
						<FolderDuplicateOutline />
						<span> Duplicate </span>
					</button>
				</li>
				<li>
					<button class="dropdown-item">
						<ArchiveOutline />
						<span> Archive </span>
					</button>
				</li>
				<span class="divider p-0 m-0" />
				<li>
					<button
						on:click={() => {
							isCollection = true;
							isDeleteModalOpen = true;
						}}
						class="dropdown-item dropdown-item-red"
					>
						<TrashBinOutline />
						<span> Delete </span>
					</button>
				</li>

				<ul />
			</ul>
		</div>
	</div>

	<div>
		{data.collection.description}
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

					<div class="dropdown dropdown-end">
						<IconBtn class="invisible group-hover:visible">
							<AdjustmentsHorizontalOutline />
						</IconBtn>

						<ul class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
							<li>
								<button class="dropdown-item">
									<PenOutline />
									<span> Rename item </span>
								</button>
							</li>
							<li>
								<button class="dropdown-item">
									<FolderDuplicateOutline />
									<span> Duplicate </span>
								</button>
							</li>

							<span class="divider p-0 m-0" />
							<li>
								<button
									on:click={() => {
										isDeleteModalOpen = true;
										selectedItemId = item.id;
									}}
									class="dropdown-item dropdown-item-red"
								>
									<TrashBinOutline />
									<span> Delete </span>
								</button>
							</li>

							<ul />
						</ul>
					</div>

					<IconBtn
						on:click={() => handleOnClickItem(item.id)}
						class="invisible group-hover:visible"
					>
						<WindowOutline class="rotate-90" />
					</IconBtn>
				</div>

				<div class="flex flex-wrap gap-2">
					{#each data.collection.properties as prop}
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

			<div class="dropdown dropdown-end">
				<IconBtn>
					<AdjustmentsHorizontalOutline />
				</IconBtn>

				<ul class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
					<li>
						<button class="dropdown-item">
							<CirclePlusOutline />
							<span> Add property </span>
						</button>
					</li>
					<li>
						<button class="dropdown-item">
							<PenOutline />
							<span> Rename item </span>
						</button>
					</li>
					<li>
						<button class="dropdown-item">
							<FolderDuplicateOutline />
							<span> Duplicate </span>
						</button>
					</li>

					<span class="divider p-0 m-0" />
					<li>
						<button
							on:click={() => {
								isDeleteModalOpen = true;
								selectedItemId = drawerSelectedItem && drawerSelectedItem.id;
							}}
							class="dropdown-item dropdown-item-red"
						>
							<TrashBinOutline />
							<span> Delete </span>
						</button>
					</li>

					<ul />
				</ul>
			</div>
		</div>

		<div class="flex flex-col space-y-1 rounded bg-gray-200 p-1 my-4">
			<!-- <Label class=" grow truncate font-semibold">Name</Label> -->
			<Input type="text" value={itemName} class=" rounded-sm text-lg border-none bg-gray-200 " />
		</div>

		<div class="flex flex-col space-y-4">
			{#each data.collection.properties as property}
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
			<Button on:click={handleDeleteCollection} color="red" class="mr-2">Yes, I'm sure</Button>
		{:else}
			<Button on:click={handleDeleteItem} color="red" class="mr-2">Yes, I'm sure</Button>
		{/if}
		<Button color="alternative">No, cancel</Button>
	</div>
</Modal>
