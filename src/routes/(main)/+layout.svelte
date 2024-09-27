<script lang="ts">
	import { page } from '$app/stores';
	import { Boxes, Database, Dna, FolderPlus, Hash, Home, PackagePlus } from 'lucide-svelte';
	import {
		Sidebar,
		SidebarCollection,
		SidebarGroupMenu,
		SidebarUserMenu,
		SidebarItem,
		setSidebarState
	} from '$lib/components/sidebar';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import { cn } from '$lib/utils';
	import * as Command from '$lib/components/ui/command';
	import {
		ModalState,
		setCtrCollectionModalState,
		setMoveCollectionModalState
	} from '$lib/components/modal';
	import { icons } from '$lib/components/icon';
	import { getScreenState } from '$lib/components/view';
	import { nameSchema } from '$lib/schema';
	import { setGroupState } from '$lib/components/group';
	import { setCollectionState } from '$lib/components/collection';

	let { data, children } = $props();
	let user = $state(data.user);
	let collections = $state(data.collections);
	let items = $state(data.items);

	let innerWidth = $state<number>(0);
	let activeUrl = $state<string>('');

	const collectionState = setCollectionState(data.collections);
	const groupState = setGroupState(data.groups);

	const globalSearchModal = new ModalState();
	const createGroupModal = new ModalState();
	const crtCollectionModal = setCtrCollectionModalState();
	const moveCollectionModal = setMoveCollectionModalState();

	type Error = { type: null } | { type: 'new-group-rename' | 'new-collection-name'; msg: string };
	let error = $state<Error>({ type: null });

	const sidebarState = setSidebarState();

	const SIDEBAR_ITEMS = [
		{ label: 'Home', url: '/', icon: Home },
		{ label: 'Templates', url: '/templates', icon: Dna },
		{ label: 'Collections', url: '/collections', icon: Database }
	];

	const isDesktop = getScreenState();

	// Groups handlers
	async function handleSubmitNewGroup(e: Event & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const name = formData.get('name') as string;

		const parseResult = nameSchema.safeParse(name);

		if (!parseResult.success) {
			error = { type: 'new-group-rename', msg: parseResult.error.issues[0].message };
			return;
		}

		error = { type: null };
		await groupState.createGroup({ name });
		createGroupModal.closeModal();
	}

	// collection handlers
	async function handleSubmitCollection(e: Event & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get('name') as string;
		const group = formData.get('group') as string;

		const parseResult = nameSchema.safeParse(name);

		if (!parseResult.success) {
			error = { type: 'new-collection-name', msg: parseResult.error.issues[0].message };
			return;
		}

		error = { type: null };

		collectionState.createCollection({ name, groupId: group || null });
		crtCollectionModal.closeModal();
	}

	function activeCollection(id: string) {
		return `/collections/${id}` === activeUrl;
	}

	$effect(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				globalSearchModal.isOpen = !globalSearchModal.isOpen;
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	$effect(() => {
		if (innerWidth < 700) $sidebarState = false;
	});

	$effect(() => {
		activeUrl = $page.url.pathname;
	});
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
				<SidebarUserMenu {user} search={() => globalSearchModal.openModal()} />
			</div>
			<div class="space-y-0.5 px-0">
				{#each SIDEBAR_ITEMS as item (item.url)}
					{@const Icon = item.icon}
					<SidebarItem label={item.label} href={item.url} active={activeUrl === item.url}>
						<Icon class={cn('icon-sm', activeUrl === item.url && 'text-primary')} />
					</SidebarItem>
				{/each}
			</div>

			<Accordion.Root
				class="grow  space-y-1.5 overflow-y-auto"
				multiple
				value={['item-0'].concat(groupState.groups.map((_group, idx) => `item-${idx + 1}`))}
			>
				<div class="space-y-0">
					{#each collectionState.collections as collection}
						{#if collection.groupId === null && collection.isPinned}
							<SidebarCollection {collection} active={activeCollection(collection.id)} />
						{/if}
					{/each}
				</div>

				{#each groupState.groups as group, idx (group.id)}
					{@const groupCollections = collectionState.collections.filter(
						(collection) =>
							collection.groupId && collection.groupId === group.id && collection.isPinned
					)}
					<Accordion.Item value={`item-${idx + 1}`}>
						<Accordion.Trigger
							class="justify-start space-x-2 py-0.5 px-2.5 text-sm font-semibold  hover:no-underline hover:bg-muted"
						>
							{group.name}

							<svelte:fragment slot="extra">
								<SidebarGroupMenu id={group.id} />
							</svelte:fragment>
						</Accordion.Trigger>

						<Accordion.Content>
							{#each groupCollections as collection}
								<SidebarCollection asChild {collection} active={activeCollection(collection.id)} />
							{/each}
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>

			<div class="flex items-center justify-between space-x-1 px-1">
				<Button
					variant="secondary"
					class="grow h-9"
					on:click={() => crtCollectionModal.openModal()}
				>
					<FolderPlus class="icon-sm" />
					<span> New collection </span>
				</Button>
				<Button variant="secondary" size="icon" on:click={() => createGroupModal.openModal()}>
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
		{@render children()}
	</div>
</div>

<!-- Create collection dialog -->
<Dialog.Root bind:open={crtCollectionModal.isOpen}>
	<Dialog.Content class={cn('sm:max-w-[425px]', !$isDesktop && 'top-auto bottom-0')}>
		<Dialog.Header>
			<Dialog.Title>New collection</Dialog.Title>
		</Dialog.Header>
		<form onsubmit={handleSubmitCollection} class="flex flex-col space-y-2">
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
			<select id="group" name="group" class="select" value={crtCollectionModal.group}>
				<option value={undefined}> Without group </option>
				{#each groupState.groups as group (group.id)}
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
<Dialog.Root bind:open={createGroupModal.isOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>New group</Dialog.Title>
		</Dialog.Header>
		<form onsubmit={handleSubmitNewGroup} class="flex flex-col space-y-2">
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
<Command.Dialog bind:open={globalSearchModal.isOpen}>
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		{#if $isDesktop}
			<Command.Group heading="Shortcuts">
				<Command.Item
					class="space-x-2"
					value="new collection"
					onSelect={() => {
						globalSearchModal.closeModal();
						crtCollectionModal.openModal();
					}}
				>
					<FolderPlus class="icon-xs" />
					<span> New collection </span>
				</Command.Item>

				<Command.Item
					class="space-x-2"
					value="new group"
					onSelect={() => {
						globalSearchModal.closeModal();
						createGroupModal.openModal();
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
				{@const Icon = icons[collection.icon]}
				<Command.Item
					class="space-x-2"
					value={collection.name}
					onSelect={() => {
						goto(`/collections/${collection.id}`);
						globalSearchModal.closeModal();
					}}
				>
					<Icon class="icon-xs" />
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
						globalSearchModal.closeModal();
					}}
				>
					<Hash class="icon-xs" />
					<span>
						{item.name}
						<span class="text-xs font-light"> - {item.collection.name}</span>
					</span>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>

<!-- Move collection dialog -->
{#if moveCollectionModal.detail}
	{@const currentGroupId = moveCollectionModal.detail.currentGroupId}
	{@const collectionId = moveCollectionModal.detail.collectionId}
	<Command.Dialog bind:open={moveCollectionModal.isOpen}>
		<Command.Input placeholder="Move collection to..." />
		<Command.List>
			<Command.Empty>No group found.</Command.Empty>
			<Command.Group>
				{#if currentGroupId}
					<Command.Item
						value="collection"
						onSelect={() => {
							collectionState.updCollection({ id: collectionId, data: { groupId: null } });
							moveCollectionModal.closeModal();
						}}
					>
						<Database class="icon-sm" />
						<span> Collection</span>
					</Command.Item>
				{/if}
				{#each groupState.groups as group (group.id)}
					{#if group.id != currentGroupId}
						<Command.Item
							value={group.name}
							onSelect={() => {
								collectionState.updCollection({ id: collectionId, data: { groupId: group.id } });
								moveCollectionModal.closeModal();
							}}
						>
							<Boxes class="icon-sm" />
							<span> {group.name} </span>
						</Command.Item>
					{/if}
				{/each}
			</Command.Group>
		</Command.List>
	</Command.Dialog>
{/if}
