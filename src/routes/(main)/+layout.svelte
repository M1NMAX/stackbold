<script lang="ts">
	import { page } from '$app/stores';
	import { Database, Dna, FolderPlus, Hash, Home, PackagePlus } from 'lucide-svelte';
	import {
		Sidebar,
		SidebarCollection,
		SidebarGroupMenu,
		SidebarUserMenu,
		SidebarItem,
		setSidebarState
	} from '$lib/components/sidebar';
	import { trpc } from '$lib/trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { onMount } from 'svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import { cn } from '$lib/utils';
	import type { RouterInputs } from '$lib/trpc/router';
	import { onSuccess, redirectToast } from '$lib/components/ui/sonner';
	import * as Command from '$lib/components/ui/command';
	import type { DeleteDetail } from '$lib/types';
	import { setCrtCollectionDialogState } from '$lib/components/modal';
	import { icons } from '$lib/components/icon';
	import { onError } from '$lib/components/ui/sonner';
	import { getScreenState } from '$lib/components/view';
	import { nameSchema } from '$lib/schema';

	export let data: LayoutData;
	$: ({ user, groups, collections, items } = data);

	let innerWidth: number;
	let isSearchDialogOpen = false;
	let isNewGroupDialogOpen = false;

	type Error = { type: null } | { type: 'new-group-rename' | 'new-collection-name'; msg: string };
	let error: Error = { type: null };

	const crtCollectionDialog = setCrtCollectionDialogState({ open: false });

	let isDeleteModalOpen = false;
	let deleteDetail: DeleteDetail = { type: null };

	const sidebarState = setSidebarState();

	const SIDEBAR_ITEMS = [
		{ label: 'Home', url: '/', icon: Home },
		{ label: 'Templates', url: '/templates', icon: Dna },
		{ label: 'Collections', url: '/collections', icon: Database }
	];

	const isDesktop = getScreenState();

	// Groups services
	async function createGroup(args: RouterInputs['groups']['create']) {
		try {
			await trpc().groups.create.mutate({ ...args });
			await onSuccess('New group created successfully');
		} catch (error) {
			onError(error);
		}
	}

	async function handleSubmitNewGroup(e: { currentTarget: HTMLFormElement }) {
		const formData = new FormData(e.currentTarget);

		const name = formData.get('name') as string;

		const parseResult = nameSchema.safeParse(name);

		if (!parseResult.success) {
			error = { type: 'new-group-rename', msg: parseResult.error.issues[0].message };
			return;
		}

		error = { type: null };
		await createGroup({ name });
		closeNewGroupDialog();
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
			const createdCollection = await trpc().collections.create.mutate(args);

			redirectToast('New collection created', `/collections/${createdCollection.id}`);
			await invalidateAll();
		} catch (error) {
			onError(error);
		}
	}

	async function handleSubmitCollection(e: { currentTarget: HTMLFormElement }) {
		const formData = new FormData(e.currentTarget);
		const name = formData.get('name') as string;
		const group = formData.get('group') as string;

		const parseResult = nameSchema.safeParse(name);

		if (!parseResult.success) {
			error = { type: 'new-collection-name', msg: parseResult.error.issues[0].message };
			return;
		}

		error = { type: null };

		createCollection({ name, groupId: group || null });

		closeCrtCollectionDialog();
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
				collectionItems.map(({ id, collectionId, ...rest }) => ({
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
			onSuccess('Collection updated');
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

	function openNewGroupDialog() {
		isNewGroupDialogOpen = true;
	}

	function closeNewGroupDialog() {
		isNewGroupDialogOpen = false;
	}

	function openCrtCollectionDialog() {
		$crtCollectionDialog = { defaultGroup: undefined, open: true };
	}

	function closeCrtCollectionDialog() {
		$crtCollectionDialog = { defaultGroup: undefined, open: false };
	}

	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				isSearchDialogOpen = !isSearchDialogOpen;
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	$: innerWidth < 700 && ($sidebarState = false);

	$: activeUrl = $page.url.pathname;
	$: activeCollection = (id: string) => $page.url.pathname === `/collections/${id}`;
</script>

<svelte:window bind:innerWidth />

<div class="h-screen flex bg-secondary">
	<Sidebar
		class={cn(
			'transition-all w-0 overflow-hidden',
			$sidebarState && `${$isDesktop ? 'w-72' : 'w-full'}`
		)}
	>
		<div
			class="h-full flex flex-col space-y-2 overflow-hidden px-0 py-1.5 rounded-none bg-card text-card-foreground"
		>
			<div class=" flex justify-between space-x-0.5 px-1">
				<SidebarUserMenu {user} on:search={() => (isSearchDialogOpen = true)} />
			</div>
			<div class="space-y-0.5 px-0">
				{#each SIDEBAR_ITEMS as item (item.url)}
					<SidebarItem label={item.label} href={item.url} active={activeUrl === item.url}>
						<svelte:component
							this={item.icon}
							slot="icon"
							class={cn('icon-sm', activeUrl === item.url && 'text-primary')}
						/>
					</SidebarItem>
				{/each}
			</div>

			<Accordion.Root
				class="grow  space-y-1.5 overflow-y-auto"
				multiple
				value={['item-0'].concat(data.groups.map((_group, idx) => `item-${idx + 1}`))}
			>
				<div class="space-y-0">
					{#each collections as collection}
						{#if collection.groupId === null && collection.isPinned}
							<SidebarCollection
								{collection}
								groups={groups.map(({ id, name }) => ({ id, name }))}
								active={activeCollection(collection.id)}
								on:duplicateCollection={({ detail }) => duplicateCollection(detail.id)}
								on:updCollection={({ detail }) =>
									updCollection({ id: detail.id, data: { [detail.field]: detail.value } })}
								on:deleteCollection={({ detail }) => {
									deleteDetail = { type: 'collection', id: detail.id, name: detail.name };
									isDeleteModalOpen = true;
								}}
							/>
						{/if}
					{/each}
				</div>

				{#each groups as group, idx (group.id)}
					{@const groupCollections = collections.filter(
						(collection) =>
							collection.groupId && collection.groupId === group.id && collection.isPinned
					)}
					<Accordion.Item value={`item-${idx + 1}`}>
						<Accordion.Trigger
							class="justify-start space-x-2 py-0.5 px-2.5 text-sm font-semibold  hover:no-underline hover:bg-muted"
						>
							{group.name}

							<svelte:fragment slot="extra">
								<SidebarGroupMenu
									id={group.id}
									name={group.name}
									on:addNewCollection={({ detail }) =>
										createCollection({
											name: detail.name,
											groupId: detail.groupId
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
									on:updCollection={({ detail }) =>
										updCollection({ id: detail.id, data: { [detail.field]: detail.value } })}
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
				<Button variant="secondary" class="grow h-9" on:click={openCrtCollectionDialog}>
					<FolderPlus class="icon-sm" />
					<span> New collection </span>
				</Button>
				<Button variant="secondary" size="icon" on:click={openNewGroupDialog}>
					<PackagePlus class="icon-sm" />
					<span class="sr-only">New group</span>
				</Button>
			</div>
		</div>
	</Sidebar>

	<div
		class={cn(
			'w-full flex relative bg-secondary',
			$sidebarState && `${$isDesktop ? 'w-full' : 'w-0'} `
		)}
	>
		<slot />
	</div>
</div>

<!-- Create collection dialog -->
<Dialog.Root bind:open={$crtCollectionDialog.open}>
	<Dialog.Content class={cn('sm:max-w-[425px]', !$isDesktop && 'top-auto bottom-0')}>
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
				class="input"
				autocomplete="off"
			/>
			{#if error.type === 'new-collection-name'}
				<span class="text-error"> {error.msg}</span>
			{/if}

			<label class="label" for="group"> Group </label>
			<select id="group" name="group" class="select" value={$crtCollectionDialog.defaultGroup}>
				<option value={undefined}> Without group </option>
				{#each groups as group (group.id)}
					<option value={group.id}>
						{group.name}
					</option>
				{/each}
			</select>

			<Button type="submit" class="w-full">Create</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Create group dialog -->
<Dialog.Root bind:open={isNewGroupDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>New group</Dialog.Title>
		</Dialog.Header>
		<form on:submit|preventDefault={handleSubmitNewGroup} class="flex flex-col space-y-2">
			<label for="group-name"> Name </label>
			<input
				id="group-name"
				type="text"
				name="name"
				placeholder="Personal, Work, ..."
				class="input"
			/>

			{#if error.type === 'new-group-rename'}
				<span class="text-error"> {error.msg} </span>
			{/if}

			<Button type="submit" class="w-full">Create</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Search dialog -->
<Command.Dialog bind:open={isSearchDialogOpen}>
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		{#if $isDesktop}
			<Command.Group heading="Shortcuts">
				<Command.Item
					class="space-x-2"
					value="new collection"
					onSelect={() => {
						isSearchDialogOpen = false;

						openCrtCollectionDialog();
					}}
				>
					<FolderPlus class="icon-xs" />
					<span> New collection </span>
				</Command.Item>

				<Command.Item
					class="space-x-2"
					value="new group"
					onSelect={() => {
						isSearchDialogOpen = false;
						openNewGroupDialog();
					}}
				>
					<PackagePlus class="icon-xs" />
					<span> New group </span>
				</Command.Item>
			</Command.Group>
			<Command.Separator />
		{/if}
		<Command.Group heading="Collections">
			{#each collections as collection}
				<Command.Item
					class="space-x-2"
					value={collection.name}
					onSelect={() => {
						goto(`/collections/${collection.id}`);
						isSearchDialogOpen = false;
					}}
				>
					<svelte:component this={icons[collection.icon]} class="icon-xs" />
					<span>{collection.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Items">
			{#each items as item}
				<Command.Item
					class="space-x-2"
					value={`${item.collection.name} ${item.name}`}
					onSelect={() => {
						goto(`/collections/${item.collection.id}?id=${item.id}`);
						isSearchDialogOpen = false;
					}}
				>
					<Hash class="icon-xs" />
					<span
						>{item.name} <span class="text-xs font-light"> - {item.collection.name}</span>
					</span>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>

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
