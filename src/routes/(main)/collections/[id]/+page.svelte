<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		ArchiveOutline,
		BarsOutline,
		CloseOutline,
		DotsHorizontalOutline,
		ExclamationCircleOutline,
		EyeOutline,
		EyeSlashOutline,
		FileCopyOutline,
		FolderDuplicateOutline,
		FolderOutline,
		HeartOutline,
		HeartSolid,
		PenOutline,
		PlusOutline,
		TrashBinOutline,
		UserAddOutline
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
	import Items from './Items.svelte';
	import InputWrapper from './InputWrapper.svelte';
	import { capitalizeFirstLetter } from '$lib/utils';
	import Options from './Options.svelte';
	import { fade } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import { getContext } from 'svelte';
	import dayjs from '$lib/dayjs';

	export let data: PageData;

	$: currCollection = data.collection;
	$: currItems = data.items;

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

	const handleCreateItem = async (name: string) => {
		try {
			//TODO: in the future, property may have default value
			await trpc().items.create.mutate({
				collectionId: currCollection.id,
				itemData: {
					name,
					properties: currCollection.properties.map((prop) => ({ id: prop.id, value: '' }))
				}
			});
			await onSuccess('New item add successfully');
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
		isDrawerHidden ? 'w-full' : 'w-2/3'
	}  ease-in-out duration-300   p-1 rounded-md bg-gray-50 flex flex-col overflow-hidden`}
>
	<div class="flex items-center space-x-1.5">
		{#if !$sidebarState}
			<IconBtn on:click={() => ($sidebarState = true)} class="btn btn-sm mr-1.5">
				<BarsOutline size="sm" />
			</IconBtn>
		{/if}

		<FolderOutline size="lg" />
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

		<IconBtn>
			<UserAddOutline />
		</IconBtn>
		<IconBtn on:click={() => handleUpdateCollection({ isFavourite: !currCollection.isFavourite })}>
			{#if currCollection.isFavourite}
				<HeartSolid class="text-primary" />
			{:else}
				<HeartOutline />
			{/if}
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

	{#if !currCollection.isDescHidden}
		<label transition:fade for="description" class="label p-1 mt-1.5">
			<span class="sr-only label-text"> Collection description</span>
			<Textarea
				id="description"
				value={currCollection.description}
				on:input={handleOnInputCollectionDesc}
				spellcheck={false}
				class="textarea textarea-ghost text-base"
			/>
		</label>
	{/if}

	<Items
		currActiveItemId={drawerSelectedItem ? drawerSelectedItem.id : undefined}
		items={data.items}
		bind:view={currView}
		collectionProperties={currCollection.properties}
		on:clickOpenItem={(e) => handleClickOpenItem(e.detail)}
		on:clickHideItem={(e) => handleUpdateItem({ id: e.detail, data: { isHidden: true } })}
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
			<PlusOutline class="text-primary" />
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
			<IconBtn
				on:click={() => {
					isDrawerHidden = true;
					drawerSelectedItem = null;
				}}
			>
				<CloseOutline size="sm" />
			</IconBtn>

			<div class="flex items-center space-x-1.5">
				{#if drawerSelectedItem}
					<span class="font-semibold text-xs text-gray-500">
						Updated
						{dayjs(drawerSelectedItem?.updatedAt).fromNow()}
					</span>
				{/if}

				<Dropdown>
					<IconBtn slot="button">
						<DotsHorizontalOutline />
					</IconBtn>
					<svelte:fragment>
						<DropdownItem
							on:click={() =>
								handleUpdateItem({
									id: drawerSelectedItem ? drawerSelectedItem.id : '',
									data: { isHidden: true }
								})}
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
			<button on:click={() => handleAddProperty()} class="btn btn-sm normal-case">
				<PlusOutline size="sm" />
				<span> Add a property </span>
			</button>
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
				class="input input-sm input-ghost font-semibold text-sm bg-base-200 col-span-9"
			/>
		</InputWrapper>

		<InputWrapper name="Type">
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
