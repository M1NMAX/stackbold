<script lang="ts">
	import {
		Calculator,
		Calendar,
		CreditCard,
		Database,
		Dna,
		KanbanSquare,
		LogOut,
		PackagePlus,
		PanelLeftInactive,
		Plus,
		Search,
		Settings,
		Smile,
		Trash2,
		User
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import {
		Sidebar,
		SidebarCollection,
		SidebarGroupMenu,
		SidebarItem
	} from '$lib/components/sidebar';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { writable } from 'svelte/store';
	import { onMount, setContext } from 'svelte';
	import { enhance } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Popover from '$lib/components/ui/popover';
	import { cn, randomIntFromInterval } from '$lib/utils';
	import type { RouterInputs } from '$lib/trpc/router';
	import * as Select from '$lib/components/ui/select';
	import { onError, onSuccess, redirectToast } from '$lib/components/feedback';
	import * as Command from '$lib/components/ui/command';
	import { Color } from '@prisma/client';

	export let data: LayoutData;
	$: ({ groups, collections } = data);

	$: favourites = data.collections.filter((collection) => collection.isFavourite);

	$: activeUrl = $page.url.pathname;
	$: activeCollection = (id: string) => $page.url.pathname === `/collections/${id}`;

	let innerWidth: number;

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

	const handleCreateCollection = async (args: RouterInputs['collections']['create']) => {
		try {
			const createdCollection = await trpc().collections.create.mutate({ ...args });

			redirectToast('New collection created', `/collections/${createdCollection.id}`);
			await invalidateAll();
			isCreateCollectionModalOpen = false;
		} catch (error) {
			onError(error);
		}
	};

	const handleSubmitCollection = async () => {
		const colorKeys = Object.keys(Color);
		const color = colorKeys[randomIntFromInterval(0, colorKeys.length)] as Color;

		handleCreateCollection({
			...createCollectionDetail,
			groupId: createCollectionDetail.groupId || null,
			icon: { color }
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

	// SEARCH HANDLERS
	let isCommandDialogOpen = false;

	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				isCommandDialogOpen = !isCommandDialogOpen;
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	$: innerWidth < 700 && ($sidebarStateStore = false);
</script>

<svelte:window bind:innerWidth />

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
						<Button
							variant="secondary"
							class="grow h-9 justify-between items-center space-x-1 rounded-sm"
							on:click={() => (isCommandDialogOpen = true)}
						>
							<span class="flex items-center space-x-0.5">
								<Search class="icon-sm" />
								<span> Search</span>
							</span>
							<kbd
								class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-0.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
							>
								<span class="text-xs">Ctrl</span>
								<span>K</span>
							</kbd>
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
				class="grow w-full space-y-1.5"
				multiple
				value={['item-0'].concat(data.groups.map((_group, idx) => `item-${idx + 1}`))}
			>
				<div class="px-2">
					<a href="/collections/" class="text-sm font-semibold"> Collections</a>
				</div>

				<div class="space-y-0">
					{#each collections as collection}
						{#if collection.groupId === null}
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
						{/if}
					{/each}
				</div>

				<Accordion.Item value="item-0">
					<Accordion.Trigger
						class="justify-start py-0.5 px-2 text-sm font-semibold  hover:no-underline hover:bg-muted"
					>
						Favourites</Accordion.Trigger
					>
					<Accordion.Content>
						{#each favourites as collection}
							<SidebarCollection
								asChild
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

				{#each groups as group, idx (group.id)}
					{@const groupCollections = collections.filter(
						(collection) => collection.groupId && collection.groupId === group.id
					)}
					<Accordion.Item value={`item-${idx + 1}`}>
						<Accordion.Trigger
							class="justify-start space-x-2 py-0.5 px-2 text-sm font-semibold  hover:no-underline hover:bg-muted"
						>
							{group.name}

							<svelte:fragment slot="extra">
								<SidebarGroupMenu
									groupId={group.id}
									groupName={group.name}
									on:addNewCollection={(e) =>
										handleCreateCollection({
											name: e.detail.name,
											groupId: e.detail.groupId,
											icon: {}
										})}
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
									asChild
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

<!-- TODO: upd cmd item -->
<Command.Dialog bind:open={isCommandDialogOpen}>
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Suggestions">
			<Command.Item>
				<Calendar class="mr-2 h-4 w-4" />
				<span>Calendar</span>
			</Command.Item>
			<Command.Item>
				<Smile class="mr-2 h-4 w-4" />
				<span>Search Emoji</span>
			</Command.Item>
			<Command.Item>
				<Calculator class="mr-2 h-4 w-4" />
				<span>Calculator</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Settings">
			<Command.Item>
				<User class="mr-2 h-4 w-4" />
				<span>Profile</span>
				<Command.Shortcut>⌘P</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<CreditCard class="mr-2 h-4 w-4" />
				<span>Billing</span>
				<Command.Shortcut>⌘B</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<Settings class="mr-2 h-4 w-4" />
				<span>Settings</span>
				<Command.Shortcut>⌘S</Command.Shortcut>
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>
