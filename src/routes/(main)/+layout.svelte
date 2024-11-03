<script lang="ts">
	import { page } from '$app/stores';
	import {
		Boxes,
		Dna,
		FolderPlus,
		Hash,
		Home,
		PackagePlus,
		PanelLeftInactive,
		LibraryBig,
		Search
	} from 'lucide-svelte';
	import {
		SidebarCollection,
		SidebarGroupMenu,
		SidebarItem,
		setSidebarState
	} from '$lib/components/sidebar';
	import { UserMenu } from '$lib/components/user';
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
		{ label: 'Collections', url: '/collections', icon: LibraryBig }
	];

	const BOTTOM_BAR_ITEMS = [
		{ label: 'Home', url: '/', icon: Home },
		{ label: 'Search', url: '/search', icon: Search },
		{ label: 'Collections', url: '/collections', icon: LibraryBig }
	];

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
		createGroupModal.close();
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
		crtCollectionModal.close();
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

	// $effect(() => {
	// 	if (innerWidth < 700) sidebarState.close();
	// });

	$effect(() => {
		activeUrl = $page.url.pathname;
	});
</script>

<svelte:window bind:innerWidth />

<div class="h-dvh w-screen flex flex-col overflow-hidden bg-background">
	<div class="h-auto w-full hidden md:flex items-center justify-between pt-1 px-1.5">
		<Button
			size="icon"
			variant="ghost"
			on:click={() => (sidebarState.isOpen = !sidebarState.isOpen)}
		>
			<PanelLeftInactive />
		</Button>

		<Button
			variant="secondary"
			class="grow h-9 max-w-sm flex justify-between items-center space-x-1"
			on:click={() => globalSearchModal.open()}
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

		<UserMenu {user} />
	</div>
	<div
		class="w-full h-full md:grow flex flex-col md:flex-row space-0 md:space-x-1.5 p-0 md:p-1 overflow-hidden bg-background"
	>
		<aside
			class={cn(
				'hidden md:flex h-full flex-col space-y-2 overflow-hidden rounded-md px-0 py-1.5 bg-card text-card-foreground transition-all',
				sidebarState.isOpen ? 'w-1/6' : 'w-0'
			)}
		>
			<div class="space-y-0.5 px-0">
				{#each SIDEBAR_ITEMS as item (item.url)}
					{@const Icon = item.icon}
					<SidebarItem label={item.label} href={item.url} active={activeUrl === item.url}>
						<Icon class={cn('icon-sm', activeUrl === item.url && 'text-primary')} />
					</SidebarItem>
				{/each}
			</div>

			<Accordion.Root
				class="grow space-y-1.5 overflow-y-auto"
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
				<Button variant="secondary" class="grow h-9" on:click={() => crtCollectionModal.open()}>
					<FolderPlus class="icon-sm" />
					<span> New collection </span>
				</Button>
				<Button variant="secondary" size="icon" on:click={() => createGroupModal.open()}>
					<PackagePlus class="icon-sm" />
					<span class="sr-only">New group</span>
				</Button>
			</div>
		</aside>

		{@render children()}

		<aside
			class={cn(
				'flex md:hidden justify-around items-center bg-secondary',
				!BOTTOM_BAR_ITEMS.map((item) => item.url).includes(activeUrl) && 'hidden'
			)}
		>
			{#each BOTTOM_BAR_ITEMS as item}
				{@const Icon = item.icon}
				<Button
					href={item.url}
					variant="ghost"
					class={cn(
						'grow h-16 flex flex-col items-center justify-center space-x-0 hover:text-primary hover:bg-transparent',
						activeUrl === item.url && 'text-primary'
					)}
				>
					<Icon class="icon-sm" />
					<span class="text-xs font-semibold">{item.label}</span>
				</Button>
			{/each}
		</aside>
	</div>
</div>

<!-- Create collection dialog -->
<Dialog.Root bind:open={crtCollectionModal.isOpen}>
	<Dialog.Content class="sm:max-w-[425px] md:top-auto md:bottom-0">
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

		<Command.Group heading="Shortcuts" class="hidden md:block">
			<Command.Item
				class="space-x-2"
				value="new collection"
				onSelect={() => {
					globalSearchModal.close();
					crtCollectionModal.open();
				}}
			>
				<FolderPlus class="icon-xs" />
				<span> New collection </span>
			</Command.Item>

			<Command.Item
				class="space-x-2"
				value="new group"
				onSelect={() => {
					globalSearchModal.close();
					createGroupModal.open();
				}}
			>
				<PackagePlus class="icon-xs" />
				<span> New group </span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Collections">
			{#each collections as collection}
				{@const Icon = icons[collection.icon]}
				<Command.Item
					class="space-x-2"
					value={collection.name}
					onSelect={() => {
						goto(`/collections/${collection.id}`);
						globalSearchModal.close();
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
				{#if item.type === 'item'}
					<Command.Item
						class="space-x-2"
						value={`${item.collection.name} ${item.name}`}
						onSelect={() => {
							goto(`/collections/${item.collection.id}?id=${item.id}`);
							globalSearchModal.close();
						}}
					>
						<Hash class="icon-xs" />
						<span>
							{item.name}
							<span class="text-xs font-light"> - {item.collection.name}</span>
						</span>
					</Command.Item>
				{/if}
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
							moveCollectionModal.close();
						}}
					>
						<LibraryBig class="icon-sm" />
						<span> Collection</span>
					</Command.Item>
				{/if}
				{#each groupState.groups as group (group.id)}
					{#if group.id != currentGroupId}
						<Command.Item
							value={group.name}
							onSelect={() => {
								collectionState.updCollection({ id: collectionId, data: { groupId: group.id } });
								moveCollectionModal.close();
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
