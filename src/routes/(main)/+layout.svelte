<script lang="ts">
	import { page } from '$app/state';
	import Boxes from 'lucide-svelte/icons/boxes';
	import Dna from 'lucide-svelte/icons/dna';
	import FolderPlus from 'lucide-svelte/icons/folder-plus';
	import Hash from 'lucide-svelte/icons/hash';
	import Home from 'lucide-svelte/icons/home';
	import PackagePlus from 'lucide-svelte/icons/package-plus';
	import PanelLeftInactive from 'lucide-svelte/icons/panel-left-inactive';
	import LibraryBig from 'lucide-svelte/icons/library-big';
	import Search from 'lucide-svelte/icons/search';
	import {
		SidebarCollection,
		SidebarGroupMenu,
		SidebarItem,
		setSidebarState
	} from '$lib/components/sidebar';
	import { UserMenu } from '$lib/components/user';
	import { goto } from '$app/navigation';
	import {
		Accordion,
		AccordionItem,
		Button,
		Command,
		CommandItem,
		Dialog
	} from '$lib/components/base/index.js';
	import {
		ModalState,
		setCtrCollectionModalState,
		setMoveCollectionModalState
	} from '$lib/states/index.js';
	import { icons } from '$lib/components/icon';
	import { nameSchema } from '$lib/schema';
	import { setGroupState } from '$lib/components/group';
	import { setCollectionState } from '$lib/components/collection';
	import { MAX_COLLECTION_NAME_LENGTH, MAX_GROUP_NAME_LENGTH } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/style.js';

	let { data, children } = $props();
	let user = $state(data.user);
	let collections = $state(data.collections);
	let items = $state(data.items);

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
		return activeUrl.includes(`/collections/${id}`);
	}

	function isBottomBarItemActive() {
		return BOTTOM_BAR_ITEMS.map((item) => item.url).includes(activeUrl);
	}

	$effect(() => {
		function handleKeydown(e: KeyboardEvent) {
			if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.shiftKey && e.key === '/')) {
				e.preventDefault();
				globalSearchModal.open();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	$effect(() => {
		activeUrl = page.url.pathname;
	});
</script>

<svelte:window />

<div class="h-dvh w-screen flex flex-col overflow-hidden bg-secondary dark:bg-background">
	<div class="h-auto w-full hidden md:flex items-center justify-between pt-1 px-1">
		<Button
			theme="outline"
			variant="icon"
			onclick={() => (sidebarState.isOpen = !sidebarState.isOpen)}
		>
			<PanelLeftInactive />
		</Button>

		<Button
			theme="outline"
			class="grow h-9 max-w-sm flex justify-between items-center space-x-1  dark:bg-background"
			onclick={() => globalSearchModal.open()}
		>
			<span class="flex items-center space-x-0.5">
				<Search class="size-4" />
				<span> Search</span>
			</span>
			<kbd
				class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-sm border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
			>
				<span class="text-xs">Ctrl</span>
				<span>K</span>
			</kbd>
		</Button>

		<UserMenu {user} />
	</div>
	<div
		class="w-full h-full md:grow flex flex-col md:flex-row gap-0 p-0 md:p-1 overflow-hidden bg-secondary dark:bg-background"
	>
		<!-- SIDEBAR -->
		<aside
			class={[
				'hidden md:flex h-full flex-col space-y-2 rounded-md px-0 py-1.5 overflow-hidden bg-card text-card-foreground transition-all',
				sidebarState.isOpen ? 'w-1/6 mr-1.5' : 'w-0'
			]}
		>
			<div class="space-y-0.5 px-0">
				{#each SIDEBAR_ITEMS as item (item.url)}
					{@const Icon = item.icon}
					<SidebarItem label={item.label} href={item.url} active={activeUrl === item.url}>
						<Icon class={`size-5 ${activeUrl === item.url && 'text-primary'}`} />
					</SidebarItem>
				{/each}
			</div>

			<div class="grow flex flex-col space-y-1.5">
				<div class="space-y-0">
					{#each collectionState.collections as collection}
						{#if collection.groupId === null && collection.isPinned}
							<SidebarCollection {collection} active={activeCollection(collection.id)} />
						{/if}
					{/each}
				</div>

				<Accordion isMulti value={groupState.groups.map((g) => g.id)}>
					{#each groupState.groups as group, idx (group.id)}
						{@const groupCollections = collectionState.collections.filter(
							(collection) =>
								collection.groupId && collection.groupId === group.id && collection.isPinned
						)}

						<AccordionItem id={group.id} title={group.name} contentClass="overflow-visible px-0">
							{#snippet extra()}
								<SidebarGroupMenu id={group.id} />
							{/snippet}
							{#each groupCollections as collection}
								<SidebarCollection asChild {collection} active={activeCollection(collection.id)} />
							{/each}
						</AccordionItem>
					{/each}
				</Accordion>
			</div>

			<div class="flex items-center justify-between space-x-1 px-1">
				<Button theme="secondary" class="grow h-9" onclick={() => crtCollectionModal.open()}>
					<FolderPlus />
					<span> New collection </span>
				</Button>
				<Button theme="secondary" variant="icon" onclick={() => createGroupModal.open()}>
					<PackagePlus />
					<span class="sr-only">New group</span>
				</Button>
			</div>
		</aside>
		<!-- SIDEBAR -->

		{@render children()}

		<aside
			class={tm(
				'flex md:hidden justify-around items-center bg-secondary',
				!isBottomBarItemActive() && 'hidden'
			)}
		>
			{#each BOTTOM_BAR_ITEMS as item}
				{@const Icon = item.icon}
				<Button
					href={item.url}
					theme="ghost"
					class={[
						'grow h-16 flex flex-col items-center justify-center space-x-0 hover:text-primary hover:bg-transparent',
						activeUrl === item.url && 'text-primary'
					]}
				>
					<Icon />
					<span class="text-xs font-semibold">{item.label}</span>
				</Button>
			{/each}
		</aside>
	</div>
</div>

<Dialog bind:open={crtCollectionModal.isOpen} title="New collection">
	<form onsubmit={handleSubmitCollection} class="flex flex-col space-y-2">
		<label for="name"> Name </label>
		<input
			id="name"
			type="text"
			name="name"
			placeholder="Tasks"
			class="input"
			autocomplete="off"
			maxlength={MAX_COLLECTION_NAME_LENGTH}
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
</Dialog>

<!-- Create group dialog -->
<Dialog bind:open={createGroupModal.isOpen} title="New group">
	<form onsubmit={handleSubmitNewGroup} class="flex flex-col space-y-2">
		<label for="group-name"> Name </label>
		<input
			id="group-name"
			type="text"
			name="name"
			placeholder="Personal, Work, ..."
			class="input"
			maxlength={MAX_GROUP_NAME_LENGTH}
		/>

		{#if error.type === 'new-group-rename'}
			<span class="text-error"> {error.msg} </span>
		{/if}

		<Button type="submit" class="w-full">Create</Button>
	</form>
</Dialog>

<!-- Search dialog -->
<Command bind:open={globalSearchModal.isOpen}>
	<CommandItem
		value="new collection"
		onselect={() => {
			globalSearchModal.close();
			crtCollectionModal.open();
		}}
	>
		<FolderPlus />
		<span> New collection </span>
	</CommandItem>

	<CommandItem
		value="new group"
		onselect={() => {
			globalSearchModal.close();
			createGroupModal.open();
		}}
	>
		<PackagePlus />
		<span> New group </span>
	</CommandItem>
	{#each collections as collection}
		{@const Icon = icons[collection.icon]}
		<CommandItem
			value={collection.name}
			onselect={() => {
				goto(`/collections/${collection.id}`);
				globalSearchModal.close();
			}}
		>
			<Icon />
			<span>{collection.name}</span>
		</CommandItem>
	{/each}
	{#each items as item}
		{#if item.type === 'item'}
			<CommandItem
				value={`${item.collection.name} ${item.name}`}
				onselect={() => {
					goto(`/collections/${item.collection.id}?id=${item.id}`);
					globalSearchModal.close();
				}}
			>
				<Hash />
				<span>
					{item.name}
					<span class="text-xs font-light"> - {item.collection.name}</span>
				</span>
			</CommandItem>
		{/if}
	{/each}
</Command>

<!-- Move collection dialog -->
{#if moveCollectionModal.detail}
	{@const currentGroupId = moveCollectionModal.detail.currentGroupId}
	{@const collectionId = moveCollectionModal.detail.collectionId}
	<Command bind:open={moveCollectionModal.isOpen} placeholder="Move collection to...">
		{#if currentGroupId}
			<CommandItem
				value="collection"
				onselect={() => {
					collectionState.updCollection({ id: collectionId, data: { groupId: null } });
					moveCollectionModal.close();
				}}
			>
				<LibraryBig />
				<span> Collection</span>
			</CommandItem>
		{/if}
		{#each groupState.groups as group (group.id)}
			{#if group.id != currentGroupId}
				<CommandItem
					value={group.name}
					onselect={() => {
						collectionState.updCollection({ id: collectionId, data: { groupId: group.id } });
						moveCollectionModal.close();
					}}
				>
					<Boxes />
					<span> {group.name} </span>
				</CommandItem>
			{/if}
		{/each}
	</Command>
{/if}
