<script lang="ts">
	import type { Collection } from '@prisma/client';
	import {
		Copy,
		CornerUpRight,
		HeartOff,
		MoreHorizontal,
		Pencil,
		PinOff,
		Trash
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import { cn } from '$lib/utils';
	import { icons } from '$lib/components/icon';
	import { getSidebarState } from './index.js';
	import { goto } from '$app/navigation';
	import { nameSchema } from '$lib/schema.js';
	import { getScreenState } from '$lib/components/view';
	import {
		getDeleteModalState,
		getMoveCollectionModalState,
		ModalState
	} from '$lib/components/modal';
	import { getGroupState } from '$lib/components/group';
	import { getCollectionState } from '$lib/components/collection';

	type Props = {
		active: boolean;
		asChild?: boolean;
		collection: Collection;
	};

	let { active, asChild = false, collection }: Props = $props();

	let renameError = $state<string | null>(null);

	const groupState = getGroupState();
	const collectionState = getCollectionState();
	const currentGroup = $derived.by(() => {
		return groupState.groups.find((group) => group.id === collection.groupId) ?? 'Without group';
	});
	const Icon = $derived(icons[collection.icon]);

	const renameCollectionModal = new ModalState();
	const smallScreenDrawer = new ModalState();

	const sidebarState = getSidebarState();
	const isDesktop = getScreenState();
	const moveCollectionModal = getMoveCollectionModalState();
	const deleteModal = getDeleteModalState();

	function handleSubmitRename(e: Event & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const name = formData.get('name') as string;

		const parseResult = nameSchema.safeParse(name);

		if (!parseResult.success) {
			renameError = parseResult.error.issues[0].message;
			return;
		}

		renameError = null;

		collectionState.updCollection({ id: collection.id, data: { name } });
		renameCollectionModal.close();
	}

	function onClickSidebarItem(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		if (e.metaKey || e.ctrlKey || $isDesktop) return;

		const { href } = e.currentTarget;
		sidebarState.close();
		goto(href);
	}

	function moveCollection() {
		if (smallScreenDrawer.isOpen) smallScreenDrawer.close();
		moveCollectionModal.open({
			collectionId: collection.id,
			currentGroupId: collection.groupId || null
		});
	}

	function deleteCollection() {
		deleteModal.open({
			type: 'collection',
			id: collection.id,
			name: collection.name,
			fun: () => {
				collectionState.deleteCollection(collection.id);
			}
		});
	}
</script>

<span
	class={cn(
		'group flex items-center py-0.5 pl-3.5 pr-0.5  hover:bg-secondary/90  transition duration-75 text-secondary-foreground',
		active && 'border-r-2 border-primary bg-secondary hover:bg-secondary/90',
		asChild && 'pl-5'
	)}
>
	<a
		href="/collections/{collection.id}"
		class="grow flex items-center space-x-1.5"
		onclick={onClickSidebarItem}
	>
		<Icon class={cn('icon-sm', active && 'text-primary')} />
		<span class={cn('font-semibold text-base text-nowrap', active && 'text-primary')}>
			{collection.name.length > 25 && $isDesktop
				? collection.name.substring(0, 22) + ' ...'
				: collection.name}
		</span>
	</a>

	{#if $isDesktop}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="ghost"
					size="xs"
					class="invisible group-hover:visible transition-opacity"
				>
					<MoreHorizontal class="icon-xs" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-56">
				<DropdownMenu.Item on:click={() => renameCollectionModal.open()}>
					<Pencil class="icon-xs" />
					<span> Rename </span>
				</DropdownMenu.Item>

				{#if collection.isPinned}
					<DropdownMenu.Item
						on:click={() => {
							collectionState.updCollection({ id: collection.id, data: { isPinned: false } });
						}}
					>
						<PinOff class="icon-xs" />
						<span> Remove from Sidebar </span>
					</DropdownMenu.Item>
				{/if}

				<DropdownMenu.Item on:click={() => moveCollection()}>
					<CornerUpRight class="icon-xs" />
					<span>Move to</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => collectionState.duplicateCollection(collection.id)}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => deleteCollection()} class="group">
					<Trash class="icon-xs group-hover:text-primary" />
					<span class="group-hover:text-primary">Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<Drawer.Root bind:open={smallScreenDrawer.isOpen}>
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} size="icon" variant="ghost">
					<MoreHorizontal class="icon-xs" />
				</Button>
			</Drawer.Trigger>

			<Drawer.Content>
				<Drawer.Header class="py-2">
					<div class="flex items-center space-x-2">
						<div class="p-2.5 rounded bg-secondary">
							<Icon class="icon-sm" />
						</div>

						<div class="flex flex-col items-start justify-start">
							<div class=" text-base font-semibold truncate">{collection.name}</div>
							<div class="text-sm">
								{currentGroup}
							</div>
						</div>
					</div>
				</Drawer.Header>

				<Drawer.Footer class="pt-2">
					{#if collection.isPinned}
						<Button
							variant="secondary"
							on:click={() => {
								collectionState.updCollection({ id: collection.id, data: { isPinned: false } });
								smallScreenDrawer.close();
							}}
						>
							<HeartOff class="icon-xs" />
							<span> Remove from Sidebar </span>
						</Button>
					{/if}

					<Button variant="secondary" on:click={() => moveCollection()}>
						<CornerUpRight class="icon-xs" />
						<span>Move to</span>
					</Button>
					<Button
						variant="secondary"
						on:click={() => {
							collectionState.duplicateCollection(collection.id);
							smallScreenDrawer.close();
						}}
					>
						<Copy class="icon-xs" />
						<span>Duplicate</span>
					</Button>
					<Button
						variant="destructive"
						on:click={() => {
							smallScreenDrawer.close();
							deleteCollection();
						}}
					>
						<Trash class="icon-xs" />
						<span>Delete</span>
					</Button>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
</span>

<Dialog.Root bind:open={renameCollectionModal.isOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Rename collection</Dialog.Title>
		</Dialog.Header>
		<form onsubmit={handleSubmitRename} class="flex flex-col space-y-2">
			<label for="collection-name"> Name </label>
			<input
				id="collection-name"
				type="text"
				name="name"
				autocomplete="off"
				value={collection.name}
				class="input"
			/>

			{#if renameError}
				<span class="text-error"> {renameError}</span>
			{/if}

			<Button type="submit" class="w-full">Save</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
