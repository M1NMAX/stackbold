<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Boxes from 'lucide-svelte/icons/boxes';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Dna from 'lucide-svelte/icons/dna';
	import File from 'lucide-svelte/icons/file';
	import FolderPlus from 'lucide-svelte/icons/folder-plus';
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
	} from '$lib/components/sidebar/index.js';
	import { UserMenu } from '$lib/components/user/index.js';
	import { goto } from '$app/navigation';
	import {
		Accordion,
		AccordionItem,
		Button,
		Command,
		CommandItem,
		Shortcut
	} from '$lib/components/base/index.js';
	import { ModalState, setMoveCollectionModalState } from '$lib/states/index.js';
	import { setGroupState } from '$lib/components/group/index.js';
	import { setCollectionState } from '$lib/components/collection/index.js';
	import { COLLECTION_ICONS, NEW_COLLECTION_NAME, NEW_GROUP_NAME } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import type { Nullable } from '$lib/types.js';

	let { data, children } = $props();
	let user = $state(data.user);
	let collections = $state(data.collections);
	let items = $state(data.items);

	let activeUrl = $state<string>('');

	const collectionState = setCollectionState(data.collections);
	const groupState = setGroupState(data.groups);

	const globalSearchModal = new ModalState();
	const moveCollectionModal = setMoveCollectionModalState();
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

	async function createCollection(groupId: Nullable<string>) {
		await collectionState.createCollection({ name: NEW_COLLECTION_NAME, groupId }, true);
	}

	function activeCollection(id: string) {
		return activeUrl.includes(`/collections/${id}`);
	}

	function isBottomBarItemActive() {
		return BOTTOM_BAR_ITEMS.map((item) => item.url).includes(activeUrl);
	}

	onMount(() => {
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
	<div
		class={tm(
			'w-full h-full lg:grow flex lg:flex-row gap-0 p-0 md:p-1 overflow-hidden bg-secondary dark:bg-background',
			isBottomBarItemActive() && 'flex-col'
		)}
	>
		<!-- SIDEBAR -->
		<aside
			class={tm(
				'hidden lg:flex h-full flex-col space-y-2 rounded-md px-0 py-2.5',
				'overflow-hidden bg-card text-card-foreground transition-all duration-300',
				sidebarState.isOpen ? 'w-lg mr-1.5 shrink-0' : 'w-0'
			)}
		>
			<div class="flex items-start justify-between gap-x-1 px-2">
				<UserMenu {user} />
				<Button
					theme="secondary"
					class="grow h-8 justify-start"
					onclick={() => globalSearchModal.open()}
				>
					<Search />
					<span class="grow text-left">Search</span>

					<Shortcut>
						<span>Ctrl</span>
						<span>K</span>
					</Shortcut>
				</Button>
				<Button
					theme="secondary"
					class="h-8"
					onclick={() => (sidebarState.isOpen = !sidebarState.isOpen)}
				>
					<PanelLeftInactive />
					<span class="sr-only">Toggle sidebar</span>
				</Button>
			</div>

			<div class="space-y-0.5 px-0">
				{#each SIDEBAR_ITEMS as item (item.url)}
					{@const Icon = item.icon}
					<SidebarItem label={item.label} href={item.url} active={activeUrl === item.url}>
						<Icon class={tm('size-5', activeUrl === item.url && 'text-primary')} />
					</SidebarItem>
				{/each}
			</div>

			<Accordion value="favorites" class="grow flex flex-col pt-1">
				<AccordionItem id="favorites" contentClass="p-0">
					{#snippet accordionHeader({ isOpen, toggle })}
						<div class="w-full group hover:bg-secondary">
							<button
								onclick={toggle}
								aria-expanded={isOpen}
								class="w-full py-0.5 px-2.5 text-sm text-left font-semibold transition-all"
							>
								Favorites
							</button>
						</div>
					{/snippet}

					{#each collectionState.collections as collection}
						{#if collection.groupId === null && collection.isPinned}
							<SidebarCollection {collection} active={activeCollection(collection.id)} />
						{/if}
					{/each}
					<Accordion isMulti value={groupState.groups.map((g) => g.id)}>
						{#each groupState.groups as group (group.id)}
							{@const groupCollections = collectionState.collections.filter(
								(collection) =>
									collection.groupId && collection.groupId === group.id && collection.isPinned
							)}

							<AccordionItem id={group.id} contentClass="overflow-visible p-0">
								{#snippet accordionHeader({ isOpen, toggle })}
									<div class="w-full relative group hover:bg-secondary">
										<button
											onclick={toggle}
											aria-expanded={isOpen}
											class="w-full flex items-center gap-1.5 px-2.5"
										>
											<ChevronRight
												class={tm(
													'size-4 shrink-0 transition-transform duration-200',
													isOpen && 'rotate-90'
												)}
											/>
											<span>
												{group.name}
											</span>
										</button>

										<SidebarGroupMenu id={group.id} {createCollection} />
									</div>
								{/snippet}
								{#each groupCollections as collection}
									<SidebarCollection
										asChild
										{collection}
										active={activeCollection(collection.id)}
									/>
								{/each}
							</AccordionItem>
						{/each}
					</Accordion>
				</AccordionItem>
			</Accordion>

			<div class="flex items-start justify-between space-x-1 px-2 pb-1">
				<Button theme="secondary" class="grow h-9" onclick={() => createCollection(null)}>
					<FolderPlus />
					<span> New collection </span>
				</Button>
				<Button
					theme="secondary"
					variant="icon"
					class="h-9"
					onclick={() => groupState.createGroup({ name: NEW_GROUP_NAME })}
				>
					<PackagePlus />
					<span class="sr-only">New group</span>
				</Button>
			</div>
		</aside>
		<!-- SIDEBAR -->

		{@render children()}

		<aside
			class={tm(
				'flex lg:hidden justify-around items-center bg-secondary',
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

<!-- Search dialog -->
<Command bind:open={globalSearchModal.isOpen}>
	<CommandItem
		value="new collection"
		onselect={() => {
			globalSearchModal.close();
			groupState.createGroup({ name: NEW_GROUP_NAME });
		}}
	>
		<FolderPlus />
		<span> New collection </span>
	</CommandItem>

	<CommandItem
		value="new group"
		onselect={() => {
			globalSearchModal.close();
			createCollection(null);
		}}
	>
		<PackagePlus />
		<span> New group </span>
	</CommandItem>
	{#each collections as collection}
		{@const Icon = COLLECTION_ICONS[collection.icon]}
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
				<File />
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
					collectionState.updCollection({ id: collectionId, groupId: null });
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
						collectionState.updCollection({ id: collectionId, groupId: group.id });
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
