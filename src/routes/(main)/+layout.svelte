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
		SidebarItem,
		setSidebarState
	} from '$lib/components/sidebar';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { onMount } from 'svelte';
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
	import type { DeleteDetail } from '$lib/types';

	export let data: LayoutData;
	$: ({ groups, collections } = data);

	let innerWidth: number;
	let isCommandDialogOpen = false;
	let isNewGroupPopoverOpen = false;

	let isCreateCollectionModalOpen = false;

	type CreateCollectionDetail = { name: string; groupId: string | undefined };
	let createCollectionDetail: CreateCollectionDetail = { name: '', groupId: undefined };

	let isDeleteModalOpen = false;
	let deleteDetail: DeleteDetail = { type: null };

	const sidebarState = setSidebarState();

	const SIDEBAR_ITEMS = [
		{ label: 'Dashboard', url: '/', icon: KanbanSquare },
		{ label: 'Templates', url: '/templates', icon: Dna },
		{ label: 'All Collections', url: '/collections', icon: Database },
		{ label: 'Tash', url: '/trash', icon: Trash2 }
	];

	// Groups services
	async function createGroup(args: RouterInputs['groups']['create']) {
		try {
			await trpc().groups.create.mutate({ ...args });
			await onSuccess('New group created successfully');
		} catch (error) {
			onError(error);
		}
	}

	async function handleKeydownNewGroup(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		e.preventDefault();

		const value = (e.target as HTMLInputElement).value;

		if (value.length < 1 || value.length > 256) {
			isNewGroupPopoverOpen = false;
			onError({ msg: '(main)/+layout: Invalid group name' }, 'Invalid group name');
			return;
		}

		await createGroup({ name: value });
		isNewGroupPopoverOpen = false;
	}

	async function updGroup(args: RouterInputs['groups']['update']) {
		try {
			await trpc().groups.update.mutate({ ...args });
			await onSuccess('Group updated');
		} catch (error) {
			onError(error);
		}
	}

	async function deleteGroup(id: string, name: string) {
		try {
			await trpc().groups.delete.mutate(id);
			await onSuccess(`Group [${name}] deleted successfully`);
		} catch (error) {
			onError(error);
		}
	}

	// COLLECTION HANDLERS

	async function createCollection(args: RouterInputs['collections']['create']) {
		try {
			const createdCollection = await trpc().collections.create.mutate({ ...args });

			redirectToast('New collection created', `/collections/${createdCollection.id}`);
			await invalidateAll();
			isCreateCollectionModalOpen = false;
		} catch (error) {
			onError(error);
		}
	}

	async function handleSubmitCollection() {
		const colorKeys = Object.keys(Color);
		const color = colorKeys[randomIntFromInterval(0, colorKeys.length)] as Color;

		createCollection({
			...createCollectionDetail,
			groupId: createCollectionDetail.groupId || null,
			icon: { color }
		});
	}

	async function duplicateCollection(id: string) {
		const targetCollection = collections.find((collection) => collection.id === id);

		if (!targetCollection) {
			onError({ msg: '(main)/+layout: Invalid collection' }, 'Selection invalid collection');
			return;
		}

		const { id: _, ownerId, name, ...rest } = targetCollection;

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

			await invalidateAll();
			redirectToast(
				`Collection [${name}] duplicated successfully`,
				`/collections/${createdCollection.id}`
			);
		} catch (error) {
			onError(error);
		}
	}

	async function updCollection(args: RouterInputs['collections']['update']) {
		try {
			await trpc().collections.update.mutate(args);

			await onSuccess('Collection updated');
			isCreateCollectionModalOpen = false;
		} catch (error) {
			onError(error);
		}
	}

	async function deleteCollection(id: string, name: string) {
		try {
			await trpc().collections.delete.mutate(id);

			await onSuccess(`Collection [${name}] deleted successfully`);

			if (activeCollection(id)) goto('/');
		} catch (error) {
			onError(error);
		}
	}

	async function handleDelete() {
		if (deleteDetail.type === 'collection') deleteCollection(deleteDetail.id, deleteDetail.name);
		else if (deleteDetail.type === 'group') deleteGroup(deleteDetail.id, deleteDetail.name);

		isDeleteModalOpen = false;
	}

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

	$: innerWidth < 700 && ($sidebarState = false);

	$: favourites = collections.filter((collection) => collection.isFavourite);

	$: activeUrl = $page.url.pathname;
	$: activeCollection = (id: string) => $page.url.pathname === `/collections/${id}`;
</script>

<svelte:window bind:innerWidth />

<div class="h-screen flex bg-secondary">
	<Sidebar class={cn('transition-all w-0', $sidebarState && 'w-64')}>
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
							on:click={() => ($sidebarState = false)}
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
				{#each SIDEBAR_ITEMS as item (item.url)}
					<SidebarItem label={item.label} href={item.url} active={activeUrl === item.url}>
						<svelte:component this={item.icon} slot="icon" />
					</SidebarItem>
				{/each}
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
								on:duplicateCollection={({ detail }) => duplicateCollection(detail.id)}
								on:renameCollection={({ detail }) =>
									updCollection({
										id: detail.id,
										data: { name: detail.name }
									})}
								on:moveCollection={({ detail }) =>
									updCollection({
										id: detail.id,
										data: { groupId: detail.groupId }
									})}
								on:toggleFavourite={({ detail }) =>
									updCollection({
										id: detail.id,
										data: { isFavourite: detail.value }
									})}
								on:deleteCollection={({ detail }) => {
									deleteDetail = { type: 'collection', id: detail.id, name: detail.name };
									isDeleteModalOpen = true;
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
								on:duplicateCollection={({ detail }) => duplicateCollection(detail.id)}
								on:renameCollection={({ detail }) =>
									updCollection({
										id: detail.id,
										data: { name: detail.name }
									})}
								on:moveCollection={({ detail }) =>
									updCollection({
										id: detail.id,
										data: { groupId: detail.groupId }
									})}
								on:toggleFavourite={({ detail }) =>
									updCollection({
										id: detail.id,
										data: { isFavourite: detail.value }
									})}
								on:deleteCollection={({ detail }) => {
									isDeleteModalOpen = true;
									deleteDetail = { type: 'collection', id: detail.id, name: detail.name };
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
									id={group.id}
									name={group.name}
									on:addNewCollection={({ detail }) =>
										createCollection({
											name: detail.name,
											groupId: detail.groupId,
											icon: {}
										})}
									on:renameGroup={({ detail }) =>
										updGroup({ id: detail.groupId, data: { name: detail.name } })}
									on:clickDeleteGroup={({ detail }) => {
										isDeleteModalOpen = true;
										deleteDetail = {
											type: 'group',
											id: detail.id,
											name: detail.name,
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
									on:duplicateCollection={({ detail }) => duplicateCollection(detail.id)}
									on:renameCollection={({ detail }) =>
										updCollection({
											id: detail.id,
											data: { name: detail.name }
										})}
									on:moveCollection={({ detail }) =>
										updCollection({
											id: detail.id,
											data: { groupId: detail.groupId }
										})}
									on:toggleFavourite={({ detail }) =>
										updCollection({
											id: detail.id,
											data: { isFavourite: detail.value }
										})}
									on:deleteCollection={({ detail }) => {
										isDeleteModalOpen = true;
										deleteDetail = { type: 'collection', id: detail.id, name: detail.name };
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
				<Button builders={[builder]} variant="destructive" on:click={handleDelete}>Continue</Button>
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
