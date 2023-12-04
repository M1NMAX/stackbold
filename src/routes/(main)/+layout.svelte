<script lang="ts">
	import {
		Database,
		Dna,
		KanbanSquare,
		LogOut,
		PackagePlus,
		PanelLeftInactive,
		Plus,
		Search,
		Settings,
		Trash2
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { Sidebar, SidebarCollection, SidebarGroupMenu, SidebarItem } from '$lib/components';

	import { trpc } from '$lib/trpc/client';
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { enhance } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';

	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import type { RouterInputs } from '$lib/trpc/router';
	import * as Select from '$lib/components/ui/select';
	import { onError, onSuccess } from '$lib/components/feedback';

	export let data: LayoutData;

	$: groups = data.groups;

	$: favourites = data.collections.filter((collection) => collection.isFavourite);

	$: activeUrl = $page.url.pathname;
	$: activeCollection = (id: string) => $page.url.pathname === `/collections/${id}`;

	const sidebarStateStore = writable(true);
	setContext('sidebarStateStore', sidebarStateStore);

	// GROUPS HANDLERS
	let isNewGroupPopoverOpen = false;
	const handleCreateGroup = async (args: RouterInputs['groups']['create']) => {
		try {
			await trpc().groups.create.mutate({ ...args });
			await onSuccess('New group created successfully');
		} catch (error) {
			onError(error);
		}
	};

	const handleKeydownNewGroup = async (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			const value = (e.target as HTMLInputElement).value;

			if (value.length < 1 || value.length > 256) {
				console.log('ERROR');
				isNewGroupPopoverOpen = false;
				onError({}, 'Invalid group name');
				return;
			}

			handleCreateGroup({ name: value });
			isNewGroupPopoverOpen = false;
		}
	};

	const handleUpdateGroup = async (args: RouterInputs['groups']['update']) => {
		try {
			await trpc().groups.update.mutate({ ...args });
			await onSuccess('Group updated');
		} catch (error) {
			onError(error);
		}
	};

	const handleDeleteGroup = async (id: string) => {
		try {
			await trpc().groups.delete.mutate(id);
			await onSuccess('Group updated');
		} catch (error) {
			onError(error);
		}
	};

	// COLLECTION HANDLERS
	let isCreateCollectionModalOpen = false;
	let createCollectionDetail: { name: string; groupId: string | undefined } = {
		name: '',
		groupId: undefined
	};
	let isGroupComboboxOpen = false;

	const handleCreateCollection = async (args: RouterInputs['collections']['create']) => {
		try {
			await trpc().collections.create.mutate({ ...args });

			await onSuccess('New collection created');
			isCreateCollectionModalOpen = false;
		} catch (error) {
			onError(error);
		}
	};

	const handleSubmitCollection = async () => {
		handleCreateCollection({
			...createCollectionDetail,
			groupId: createCollectionDetail.groupId || null
		});
	};

	const handleDuplicateCollection = async (id: string) => {
		const foundedCollection = data.collections.find((collection) => collection.id === id);

		if (!foundedCollection) {
			onError({});
			return;
		}

		const { id: _, ownerId, name, ...rest } = foundedCollection;

		try {
			const createdCollection = await trpc().collections.create.mutate({
				...rest,
				name: name + ' copy'
			});

			const collectionItems = await trpc().items.list.query(id);

			await trpc().items.createMany.mutate(
				collectionItems.map(({ id, collectionId, updatedByUserId, ...rest }) => ({
					collectionId: createdCollection.id,
					...rest
				}))
			);

			await onSuccess('Collection duplicated');
		} catch (error) {
			onError(error);
		}
	};

	const handleUpdateCollection = async (args: RouterInputs['collections']['update']) => {
		try {
			await trpc().collections.update.mutate({ ...args });

			await onSuccess('Collection updated');
			isCreateCollectionModalOpen = false;
		} catch (error) {
			onError(error);
		}
	};

	const handleDeleteCollection = async (id: string) => {
		try {
			await trpc().collections.delete.mutate(id);

			await onSuccess('Collection deleted');

			if (activeCollection(id)) goto('/');
		} catch (error) {
			onError(error);
		}
	};

	// HANDLE COLLECTION AND GROUP DELETION
	let isDeleteModalOpen = false;
	let deleteDetail:
		| { type: null }
		| { type: 'collection'; id: string }
		| { type: 'group'; id: string; includeCollections: boolean } = { type: null };

	$: handleOnClickModalDeleteBtn = () => {
		switch (deleteDetail.type) {
			case 'collection':
				handleDeleteCollection(deleteDetail.id);
				break;

			case 'group':
				handleDeleteGroup(deleteDetail.id);
				break;

			default:
				break;
		}
		isDeleteModalOpen = false;
	};
</script>

<div class="h-screen flex bg-secondary">
	<Sidebar class={cn('transition-all w-0', $sidebarStateStore && 'w-64')}>
		<div
			class="h-full flex flex-col space-y-2 overflow-hidden px-0 py-1.5 rounded-none bg-card text-card-foreground"
		>
			<div class="w-full flex justify-between space-x-0.5 px-1">
				<DropdownMenu.Root>
					<div class="w-full flex items-center justify-between space-x-1">
						<DropdownMenu.Trigger asChild let:builder>
							<Button
								builders={[builder]}
								variant="secondary"
								class="h-9 w-9 flex items-center justify-center p-0.5 rounded-sm ring-1 ring-card"
							>
								<img
									src={`https://api.dicebear.com/7.x/shapes/svg?seed=${data.user.name}`}
									class="h-7 w-7 rounded-sm"
									alt="avatar"
								/>
							</Button>
						</DropdownMenu.Trigger>
						<Button variant="secondary" class="grow h-9 justify-start space-x-1 rounded-sm">
							<Search class="icon-sm" />
							<span> Search</span>
						</Button>

						<Button
							variant="secondary"
							size="icon"
							on:click={() => ($sidebarStateStore = false)}
							class="rounded-sm"
						>
							<PanelLeftInactive class="icon-sm" />
							<span class="sr-only"> Hide sidebar </span>
						</Button>
					</div>
					<DropdownMenu.Content class="w-56">
						<DropdownMenu.Label>{data.user.name} | {data.user.email}</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item href="/settings" class="space-x-2">
								<Settings class="icon-xs" />
								<span>Settings</span>
							</DropdownMenu.Item>
						</DropdownMenu.Group>

						<DropdownMenu.Separator />

						<form method="post" action="/?/logout" use:enhance>
							<!-- //TODO: add action -->
							<DropdownMenu.Item class="space-x-2">
								<LogOut class="icon-xs" />
								<span>Log out</span>
							</DropdownMenu.Item>
						</form>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
			<div class="space-y-0.5 px-0">
				<SidebarItem label="Dashboard" href="/" active={activeUrl === '/'}>
					<svelte:fragment slot="icon">
						<KanbanSquare />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Templates" href="/templates" active={activeUrl === '/templates'}>
					<svelte:fragment slot="icon">
						<Dna />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem
					label="All Collections"
					href="/collections"
					active={activeUrl === '/collections'}
				>
					<svelte:fragment slot="icon">
						<Database />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Trash" href="/trash" active={activeUrl === '/trash'}>
					<svelte:fragment slot="icon">
						<Trash2 />
					</svelte:fragment>
				</SidebarItem>
			</div>

			<!-- TODO: handle scroll, when there are too many collections -->

			<Accordion.Root
				class="grow w-full space-y-2"
				multiple
				value={['item-0'].concat(data.groups.map((_group, idx) => `item-${idx + 1}`))}
			>
				<Accordion.Item value="item-0">
					<Accordion.Trigger
						class="justify-start py-0.5 px-1 text-sm font-semibold  hover:no-underline hover:bg-muted"
					>
						Favourites</Accordion.Trigger
					>
					<Accordion.Content>
						{#each favourites as collection}
							<SidebarCollection
								{collection}
								groups={groups.map(({ id, name }) => ({ id, name }))}
								active={activeCollection(collection.id)}
								on:duplicateCollection={(e) => handleDuplicateCollection(e.detail.id)}
								on:renameCollection={(e) =>
									handleUpdateCollection({
										id: e.detail.id,
										data: { name: e.detail.name }
									})}
								on:toggleFavourite={(e) =>
									handleUpdateCollection({
										id: e.detail.id,
										data: { isFavourite: e.detail.value }
									})}
								on:deleteCollection={(e) => {
									isDeleteModalOpen = true;
									deleteDetail = { type: 'collection', id: e.detail.id };
								}}
							/>
						{/each}
					</Accordion.Content>
				</Accordion.Item>

				{#each groups as group, idx (group.id)}
					{@const groupCollections = data.collections.filter(
						(collection) => collection.groupId && collection.groupId === group.id
					)}
					<Accordion.Item value={`item-${idx + 1}`}>
						<Accordion.Trigger
							class="justify-start space-x-2 py-0.5 px-1 text-sm font-semibold  hover:no-underline hover:bg-muted"
						>
							{group.name}

							<svelte:fragment slot="extra">
								<SidebarGroupMenu
									groupId={group.id}
									groupName={group.name}
									on:addNewCollection={(e) =>
										handleCreateCollection({ name: e.detail.name, groupId: e.detail.groupId })}
									on:renameGroup={(e) =>
										handleUpdateGroup({ id: e.detail.groupId, data: { name: e.detail.name } })}
									on:clickDeleteGroup={(e) => {
										isDeleteModalOpen = true;
										deleteDetail = {
											type: 'group',
											id: e.detail.id,
											includeCollections: false
										};
									}}
								/>
							</svelte:fragment>
						</Accordion.Trigger>

						<Accordion.Content>
							{#each groupCollections as collection}
								<SidebarCollection
									{collection}
									groups={groups.map(({ id, name }) => ({ id, name }))}
									active={activeCollection(collection.id)}
									on:duplicateCollection={(e) => handleDuplicateCollection(e.detail.id)}
									on:renameCollection={(e) =>
										handleUpdateCollection({
											id: e.detail.id,
											data: { name: e.detail.name }
										})}
									on:moveCollection={(e) =>
										handleUpdateCollection({
											id: e.detail.id,
											data: { groupId: e.detail.groupId }
										})}
									on:toggleFavourite={(e) =>
										handleUpdateCollection({
											id: e.detail.id,
											data: { isFavourite: e.detail.value }
										})}
									on:deleteCollection={(e) => {
										isDeleteModalOpen = true;
										deleteDetail = { type: 'collection', id: e.detail.id };
									}}
								/>
							{/each}
						</Accordion.Content>
					</Accordion.Item>
				{/each}
				<Accordion.Item value="item-x">
					<Accordion.Trigger
						class="justify-start py-0.5 px-1 text-sm font-semibold  hover:no-underline hover:bg-muted"
					>
						All Collections
					</Accordion.Trigger>

					<Accordion.Content>
						{#each data.collections as collection}
							<SidebarCollection
								{collection}
								groups={groups.map(({ id, name }) => ({ id, name }))}
								active={activeCollection(collection.id)}
								on:duplicateCollection={(e) => handleDuplicateCollection(e.detail.id)}
								on:renameCollection={(e) =>
									handleUpdateCollection({
										id: e.detail.id,
										data: { name: e.detail.name }
									})}
								on:toggleFavourite={(e) =>
									handleUpdateCollection({
										id: e.detail.id,
										data: { isFavourite: e.detail.value }
									})}
								on:deleteCollection={(e) => {
									isDeleteModalOpen = true;
									deleteDetail = { type: 'collection', id: e.detail.id };
								}}
							/>
						{/each}
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			<div class="flex items-center justify-between space-x-1 px-1">
				<Button
					variant="secondary"
					class="grow h-9 space-x-2 rounded-sm"
					on:click={() => (isCreateCollectionModalOpen = true)}
				>
					<Plus class="icon-sm" />
					<span> New collection </span>
				</Button>

				<Popover.Root bind:open={isNewGroupPopoverOpen}>
					<Popover.Trigger asChild let:builder>
						<Button builders={[builder]} variant="secondary" size="icon" class="rounded-sm">
							<PackagePlus class="icon-sm" />
							<span class="sr-only">New group</span>
						</Button>
					</Popover.Trigger>
					<Popover.Content>
						<form class="space-y-1">
							<div class="flex space-x-1.5">
								<label for="name" class=" sr-only"> Name </label>
								<input
									id="name"
									name="name"
									placeholder="New group"
									class="grow input input-ghost px-1 font-semibold text-sm bg-base-200"
									on:keydown={handleKeydownNewGroup}
								/>
							</div>
						</form>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>
	</Sidebar>

	<div class="w-full flex space-x-1 m-1 relative bg-secondary">
		<slot />
	</div>
</div>

<Dialog.Root bind:open={isCreateCollectionModalOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>New collection</Dialog.Title>
		</Dialog.Header>
		<form on:submit|preventDefault={handleSubmitCollection} class="flex flex-col space-y-2">
			<label for="name"> Name </label>
			<input
				id="name"
				type="text"
				name="name"
				placeholder="Tasks"
				required
				class="input input-ghost bg-gray-200"
				bind:value={createCollectionDetail.name}
			/>
			<!-- TODO: maybe Use shadcn form -->
			<label for="location">
				Group
				<Select.Root
					onSelectedChange={(currentItem) => {
						createCollectionDetail.groupId =
							typeof currentItem?.value === 'string' ? currentItem.value : undefined;
					}}
				>
					<Select.Trigger class="w-full">
						<Select.Value placeholder="Select a group" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value={undefined}>Without group</Select.Item>
						{#each groups as group (group.id)}
							<Select.Item value={group.id}>{group.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</label>

			<Button type="submit" class="w-full">Create</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

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
				<Button builders={[builder]} variant="destructive" on:click={handleOnClickModalDeleteBtn}>
					Continue
				</Button>
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
