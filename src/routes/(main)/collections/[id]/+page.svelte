<script lang="ts">
	import {
		Archive,
		Copy,
		Eye,
		EyeOff,
		Heart,
		HeartOff,
		MoreHorizontal,
		Pencil,
		Plus,
		Trash,
		UserPlus,
		X
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { type Item, PropertyType } from '@prisma/client';
	import { Items, Textarea } from '$lib/components';
	import { AddPropertyPopover, PropertyInput } from '$lib/components/property';
	import debounce from 'debounce';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { RouterInputs } from '$lib/trpc/router';
	import { capitalizeFirstLetter, cn } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import dayjs from '$lib/utils/dayjs';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Drawer } from '$lib/components/ui/drawer';
	import { errorToast, onError, redirectToast, successToast } from '$lib/components/feedback';
	import { PageHeader, PageContent } from '$lib/components/page';
	import { IconPicker } from '$lib/components/icon';
	import { page } from '$app/stores';
	import PropertyInputWrapper from '$lib/components/property/property-input-wrapper.svelte';
	import type { DeleteDetail } from '$lib/types';

	export let data: PageData;
	$: ({ collection, items } = data);
	$: ({ properties } = collection);

	// View
	let currView = 'list';

	// Delete Modal
	let isDeleteModalOpen = false;
	let deleteDetail: DeleteDetail = { type: null };

	// Drawer
	let isDrawerHidden = true;
	let drawerSelectedItem: Item | null = null;

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

	async function handleDuplicateItem(itemId: string) {
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

	async function handleDeleteItem(id: string) {
		await trpc().items.delete.mutate(id);

		items = items.filter((item) => item.id !== id);

		successToast('Item deleted successfully');
		if ($page.url.searchParams.has('id') && $page.url.searchParams.get('id') === id) {
			isDrawerHidden = true;
			$page.url.searchParams.delete('id');
			goto(`/collections/${collection.id}`);
		}
	}

	// Item input handlers
	async function handleOnInputItemName(e: { currentTarget: EventTarget & HTMLHeadingElement }) {
		if (!drawerSelectedItem) return;
		const id = drawerSelectedItem.id;

		//TODO:valide inner text
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
		if (!drawerSelectedItem) return '';

		const itemProperty = drawerSelectedItem.properties.find((property) => property.id === pid);

		const collectionProperty = properties.find((property) => property.id === pid);

		if (!itemProperty || !collectionProperty) return '';

		if (collectionProperty.type !== PropertyType.SELECT) return itemProperty.value;

		const option = collectionProperty.options.find((opt) => opt.id === itemProperty.value);

		return option ? option.id : '';
	}

	async function addPropertyToCollection(args: RouterInputs['collections']['addProperty']) {
		const { properties: updatedProps } = await trpc().collections.addProperty.mutate(args);

		const sortedProps = updatedProps.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		return sortedProps[sortedProps.length - 1];
	}

	async function handleAddProperty(type: PropertyType) {
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
	async function handleDuplicateProperty(pid: string) {
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

	async function handleDeleteProperty(pid: string) {
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

			drawerSelectedItem = updatedItem;

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

	async function handleDeletePropertyOption(pid: string, optionId: string) {
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

	function preventEnterKeypress(e: KeyboardEvent) {
		if (e.key == 'Enter') e.preventDefault();
	}

	$: if ($page.url.searchParams.has('id')) {
		isDrawerHidden = false;

		const itemId = $page.url.searchParams.get('id');
		drawerSelectedItem = data.items.find((item) => item.id === itemId) || null;
	} else {
		isDrawerHidden = true;
		drawerSelectedItem = null;
	}

	$: handleClickModalDeleteBtn = () => {
		switch (deleteDetail.type) {
			case 'collection':
				deleteCollection(deleteDetail.id, deleteDetail.name);
				break;

			case 'item':
				handleDeleteItem(deleteDetail.id);
				break;

			case 'property':
				handleDeleteProperty(deleteDetail.id);
				break;

			case 'option':
				handleDeletePropertyOption(deleteDetail.id, deleteDetail.option);
				break;

			default:
				break;
		}
		isDeleteModalOpen = false;
	};
</script>

<svelte:head>
	<title>{collection.name} - Stackbold</title>
</svelte:head>

<div
	class={cn(
		'w-full flex flex-col space-y-1 p-1 ease-in-out duration-300 rounded-md bg-card text-secondary-foreground overflow-hidden',
		!isDrawerHidden && 'w-2/3'
	)}
>
	<PageHeader>
		<span class="font-semibold text-xs text-gray-500 mr-2">
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
			{#if collection.isFavourite}
				<HeartOff />
			{:else}
				<Heart />
			{/if}
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

	<PageContent class="lg:py-1 lg:px-8">
		<div class="flex items-center space-x-2">
			<IconPicker
				name={collection.icon.name}
				color={collection.icon.color}
				onIconChange={(icon) => updCollection({ icon })}
			/>

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

		<!-- //TODO: impl rename item menu-->
		<Items
			currActiveItemId={drawerSelectedItem ? drawerSelectedItem.id : undefined}
			{items}
			bind:view={currView}
			collectionProperties={properties}
			onClickNewItemBtn={() => handleCreateItem('Untitled', true)}
			on:clickOpenItem={(e) => handleClickOpenItem(e.detail)}
			on:clickRename={(e) => updItem({ id: e.detail, data: { name: 'something' } })}
			on:clickDuplicateItem={(e) => handleDuplicateItem(e.detail)}
			on:clickDeleteItem={(e) => {
				deleteDetail = { type: 'item', id: e.detail };
				isDeleteModalOpen = true;
			}}
			on:updPropertyValue={(e) => {
				updPropertyValueDebounced(e.detail.itemId, {
					id: e.detail.property.id,
					value: e.detail.property.value
				});
			}}
			on:updPropertyVisibility={(e) => {
				updPropertyDebounced({ id: e.detail.pid, [e.detail.name]: e.detail.value });
			}}
		/>

		<div class="relative">
			<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
				<Plus class="text-primary" />
			</div>
			<input
				class="w-full h-10 pl-10 text-base font-semibold rounded bg-secondary placeholder:text-primary focus:outline-none focus:placeholder:text-gray-800"
				placeholder="Add new item"
				on:keypress={handleKeypressNewItemInput}
			/>
		</div>
	</PageContent>
</div>

<Drawer bind:hidden={isDrawerHidden} id="itemDrawer" class="absolute w-full lg:w-1/3 p-0 pl-1">
	<div class="h-full flex flex-col space-y-1.5 p-1 rounded-md bg-card">
		<div class="flex justify-between items-center">
			<Button
				variant="secondary"
				size="icon"
				on:click={() => {
					goto(`/collections/${collection.id}`);

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
						<Button builders={[builder]} variant="secondary" size="icon"><MoreHorizontal /></Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56">
						<DropdownMenu.Group>
							<!-- TODO: Implement rename -->
							<DropdownMenu.Item disabled class="space-x-2">
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

									deleteDetail = { type: 'item', id: drawerSelectedItem.id };
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
				{drawerSelectedItem?.name}
			</h2>

			<div class="space-y-2">
				{#each properties as property}
					<PropertyInputWrapper
						{property}
						isCheckBox={property.type === PropertyType.CHECKBOX}
						on:updPropertyField={({ detail }) =>
							updPropertyDebounced({ id: detail.pid, [detail.name]: detail.value })}
						on:duplicate={(e) => handleDuplicateProperty(e.detail)}
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
						<PropertyInput
							{property}
							value={getPropertyValue(property.id)}
							on:updPropertyValue={({ detail }) => {
								if (!drawerSelectedItem) return;

								updPropertyValueDebounced(drawerSelectedItem.id, {
									id: detail.pid,
									value: detail.value
								});
							}}
						/>
					</PropertyInputWrapper>
				{/each}
			</div>
		</div>
		<div class="grid justify-items-start">
			<AddPropertyPopover on:clickPropType={(e) => handleAddProperty(e.detail)} />
		</div>
	</div>
</Drawer>

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
				<Button builders={[builder]} variant="destructive" on:click={handleClickModalDeleteBtn}>
					Continue
				</Button>
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
