<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		ArchiveOutline,
		CirclePlusOutline,
		CloseOutline,
		DotsHorizontalOutline,
		ExclamationCircleOutline,
		EyeOutline,
		EyeSlashOutline,
		FileCopyOutline,
		FolderDuplicateOutline,
		HeartOutline,
		HeartSolid,
		PenOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { Drawer } from 'flowbite-svelte';
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
		Dropdown,
		DropdownItem,
		DropdownDivider,
		IconBtn,
		Modal,
		Textarea
	} from '$lib/components';
	import debounce from 'debounce';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import toast from 'svelte-french-toast';
	import type { RouterInputs } from '$lib/trpc/router';
	import { DEFAULT_DEBOUNCE_INTERVAL, DEFAULT_FEEDBACK_ERR_MESSAGE } from '$lib/constant';
	import Item from './Item.svelte';
	import InputWrapper from './InputWrapper.svelte';
	import { capitalizeFirstLetter } from '$lib/utils';
	import Options from './Options.svelte';

	export let data: PageData;

	$: currCollection = data.collection;
	$: currItems = data.items;

	let selectedProperty: CollectionPropertyType | null = null;
	let drawerSelectedItem: ItemType | null = null;
	let selectedItemId: string | null = null;

	// Drawer
	let isDrawerHidden = true;

	let transitionParams = {
		x: 320,
		duration: 300,
		easing: sineIn
	};

	// Delete Modal
	let isDeleteModalOpen = false;

	type ElementType = 'collection' | 'item' | 'property' | 'option' | null;

	type ToBeDeleted = {
		id: string | null;
		type: ElementType;
		option?: string;
	};

	let elementToBeDelete: ToBeDeleted = { id: null, type: null };

	$: handleOnClickModalDeleteBtn = () => {
		const { id, type, option } = elementToBeDelete;

		if (!id) return;

		switch (type) {
			case 'collection':
				handleDeleteCollection();
				break;

			case 'item':
				handleDeleteItem();
				break;

			case 'property':
				handleDeleteProperty(id);
				break;

			case 'option':
				if (!option) return;
				handleDeletePropertyOption(id, option);
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

	const handleClickOpenItem = async (itemId: string) => {
		isDrawerHidden = false;
		drawerSelectedItem = await trpc().items.load.query(itemId);
	};

	//TODO: remove useless debounce fun
	// Collection handlers
	const handleDeleteCollection = async () => {
		if (currCollection.ownerId !== data.user.userId) {
			toast.error('Unauthorized');
			return;
		}

		await trpc().collections.delete.mutate(currCollection.id);
		await invalidateAll();

		goto('/collections');
		toast.success('Collection deleted');
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

	const handleUpdateItem = async (
		itemId: string,
		detail: RouterInputs['items']['update']['data']
	) => {
		await trpc().items.update.mutate({
			id: itemId,
			data: detail
		});

		await onSuccess('Item updated successfully');
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

	const handleEditProperty = (pid: string) => (selectedProperty = getProperty(currCollection, pid));

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

	const debounceItemUpdate = debounce(handleUpdateItem, DEFAULT_DEBOUNCE_INTERVAL);
	const handleItemNameChange = async (e: Event) => {
		const input = e.target as HTMLTextAreaElement;

		if (!drawerSelectedItem) return;

		const id = drawerSelectedItem.id;

		debounceItemUpdate(id, { name: input.value });
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
		<h1
			class="grow font-semibold text-2xl focus:outline-none focus:border-b-2 focus:border-gray-300"
			contenteditable
			spellcheck={false}
			on:input={handleOnInputCollectionName}
		>
			{currCollection.name}
		</h1>

		<IconBtn on:click={() => handleUpdateCollection({ isFavourite: !currCollection.isFavourite })}>
			{#if currCollection.isFavourite}
				<HeartSolid class="text-primary" />
			{:else}
				<HeartOutline />
			{/if}
		</IconBtn>

		<IconBtn>
			<AdjustmentsHorizontalOutline />
		</IconBtn>

		<Dropdown>
			<IconBtn slot="button">
				<DotsHorizontalOutline />
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
						elementToBeDelete = { id: currCollection.id, type: 'collection' };
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
					elementToBeDelete = { id: item.id, type: 'item' };
					isDeleteModalOpen = true;

					selectedItemId = item.id;
				}}
			/>
		{/each}
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
	class="w-full xl:w-2/6 p-2 bg-gray-200"
>
	<div class="h-full rounded-md bg-gray-50 p-3">
		<div class="flex justify-between items-center">
			<IconBtn
				on:click={() => {
					isDrawerHidden = true;
					drawerSelectedItem = null;
				}}
			>
				<CloseOutline size="sm" />
			</IconBtn>

			<Dropdown>
				<IconBtn slot="button">
					<DotsHorizontalOutline />
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
							if (!drawerSelectedItem) return;

							elementToBeDelete = { id: drawerSelectedItem.id, type: 'item' };
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

		<div class="rounded bg-gray-200 p-1 my-4">
			<Textarea
				spellcheck={false}
				value={drawerSelectedItem?.name}
				on:input={handleItemNameChange}
				placeholder="Empty"
				class="textarea textarea-sm textarea-ghost font-semibold  bg-gray-200"
			/>
		</div>

		<div class="flex flex-col space-y-4">
			{#each currCollection.properties as property}
				<CollectionProperty
					{property}
					value={getItemPropValue(
						property.id,
						drawerSelectedItem ? drawerSelectedItem.properties : []
					)}
					on:update={(e) => {
						if (!drawerSelectedItem) return;

						handleUpdatePropertyValue(drawerSelectedItem.id, e.detail.property);
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
</Drawer>

<Modal title="Property" open={!!selectedProperty} onClose={() => (selectedProperty = null)}>
	<form class="space-y-1">
		<InputWrapper name="Name">
			<input
				id={selectedProperty?.id}
				value={selectedProperty?.name}
				on:input={handleOnInputPropertyField}
				name="name"
				class="input input-xs input-ghost text-sm bg-base-200"
			/>
		</InputWrapper>

		<InputWrapper name="Type">
			<select
				id={selectedProperty?.id}
				name="type"
				value={selectedProperty?.type}
				on:input={handleOnInputPropertyField}
				class="select select-xs select-ghost text-sm bg-base-200"
			>
				{#each propertyTypes as propertyType}
					<option value={propertyType}>
						{capitalizeFirstLetter(propertyType)}
					</option>
				{/each}
			</select>
		</InputWrapper>

		{#if selectedProperty && selectedProperty.type === 'SELECT' && selectedProperty.options}
			<Options
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
</Modal>

<Modal open={isDeleteModalOpen} onClose={() => (isDeleteModalOpen = false)}>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to delete this {elementToBeDelete.type} ?
		</h3>

		<button on:click={handleOnClickModalDeleteBtn} class="btn btn-error btn-sm">
			Yes, I'm sure
		</button>

		<button class="btn btn-sm">No, cancel</button>
	</div>
</Modal>
