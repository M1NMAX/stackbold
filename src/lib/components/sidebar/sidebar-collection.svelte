<script lang="ts">
	import type { Collection } from '@prisma/client';
	import {
		Boxes,
		Copy,
		CornerUpRight,
		Database,
		HeartOff,
		MoreHorizontal,
		Pencil,
		PinOff,
		Trash
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Command from '$lib/components/ui/command';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils';
	import { icons } from '$lib/components/icon';
	import { getSidebarState } from './index.js';
	import { goto } from '$app/navigation';
	import { nameSchema } from '$lib/schema.js';
	import { getScreenState } from '$lib/components/view';

	export let active: boolean;
	export let asChild: boolean = false;
	export let collection: Collection;
	export let groups: { id: string; name: string }[];
	$: ({ id, name, icon } = collection);

	let isMoveDialogOpen = false;
	let isRenameDialogOpen = false;
	let isSmallScrenDrawerOpen = false;

	let renameError: string | null = null;

	const sidebarState = getSidebarState();
	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		updCollection: { id: string; field: keyof Collection; value: string | boolean | null };
		duplicateCollection: { id: string };
		deleteCollection: { id: string; name: string };
	}>();

	function handleSubmitRename(e: { currentTarget: HTMLFormElement }) {
		const formData = new FormData(e.currentTarget);

		const name = formData.get('name') as string;

		const parseResult = nameSchema.safeParse(name);

		if (!parseResult.success) {
			renameError = parseResult.error.issues[0].message;
			return;
		}

		renameError = null;
		dispatch('updCollection', { id, field: 'name', value: name });

		closeRenameDialog();
	}

	function onClickSidebarItem(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		if (e.metaKey || e.ctrlKey || $isDesktop) return;

		const { href } = e.currentTarget;
		$sidebarState = false;
		goto(href);
	}

	function openMoveDialog() {
		isMoveDialogOpen = true;
	}

	function closeMoveDialog() {
		isMoveDialogOpen = false;
	}

	function closeSmallScreenDrawer() {
		isSmallScrenDrawerOpen = false;
	}

	function openRenameDialog() {
		isRenameDialogOpen = true;
	}

	function closeRenameDialog() {
		isRenameDialogOpen = false;
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
		href="/collections/{id}"
		class="grow flex items-center space-x-1.5"
		on:click={onClickSidebarItem}
	>
		<svelte:component this={icons[icon]} class={cn('icon-sm', active && 'text-primary')} />
		<span class={cn('font-semibold text-base text-nowrap', active && 'text-primary')}>
			{name.length > 25 && $isDesktop ? name.substring(0, 22) + ' ...' : name}
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
				<DropdownMenu.Item on:click={openRenameDialog}>
					<Pencil class="icon-xs" />
					<span> Rename </span>
				</DropdownMenu.Item>

				{#if collection.isPinned}
					<DropdownMenu.Item
						on:click={() => {
							dispatch('updCollection', { id, field: 'isPinned', value: false });
						}}
					>
						<PinOff class="icon-xs" />
						<span> Remove from Sidebar </span>
					</DropdownMenu.Item>
				{/if}

				<DropdownMenu.Item on:click={openMoveDialog}>
					<CornerUpRight class="icon-xs" />
					<span>Move to</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={() => dispatch('duplicateCollection', { id })}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item
					on:click={() => dispatch('deleteCollection', { id, name })}
					class="group"
				>
					<Trash class="icon-xs group-hover:text-primary" />
					<span class="group-hover:text-primary">Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<Drawer.Root bind:open={isSmallScrenDrawerOpen}>
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} size="icon" variant="ghost">
					<MoreHorizontal class="icon-xs" />
				</Button>
			</Drawer.Trigger>

			<Drawer.Content>
				<Drawer.Header class="py-2">
					<div class="flex items-center space-x-2">
						<div class="p-2.5 rounded bg-secondary">
							<svelte:component this={icons[icon]} class="icon-sm" />
						</div>

						<div class="flex flex-col items-start justify-start">
							<div class=" text-base font-semibold truncate">{name}</div>
							<div class="text-sm">
								{groups.find((group) => group.id === collection.groupId)?.name ?? 'Without group'}
							</div>
						</div>
					</div>
				</Drawer.Header>

				<Drawer.Footer class="pt-2">
					{#if collection.isPinned}
						<Button
							variant="secondary"
							on:click={() => {
								dispatch('updCollection', {
									id,
									field: 'isPinned',
									value: false
								});
								closeSmallScreenDrawer();
							}}
						>
							<HeartOff class="icon-xs" />
							<span> Remove from Sidebar </span>
						</Button>
					{/if}

					<Button
						variant="secondary"
						on:click={() => {
							closeSmallScreenDrawer();
							openMoveDialog();
						}}
					>
						<CornerUpRight class="icon-xs" />
						<span>Move to</span>
					</Button>
					<Button
						variant="secondary"
						on:click={() => {
							dispatch('duplicateCollection', { id });
							closeSmallScreenDrawer();
						}}
					>
						<Copy class="icon-xs" />
						<span>Duplicate</span>
					</Button>
					<Button
						variant="destructive"
						on:click={() => {
							closeSmallScreenDrawer();
							dispatch('deleteCollection', { id, name });
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

<Dialog.Root bind:open={isRenameDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Rename collection</Dialog.Title>
		</Dialog.Header>
		<form on:submit|preventDefault={handleSubmitRename} class="flex flex-col space-y-2">
			<label for="collection-name"> Name </label>
			<input
				id="collection-name"
				type="text"
				name="name"
				autocomplete="off"
				value={name}
				class="input"
			/>

			{#if renameError}
				<span class="text-error"> {renameError}</span>
			{/if}

			<Button type="submit" class="w-full">Save</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Command.Dialog bind:open={isMoveDialogOpen}>
	<Command.Input placeholder="Move collection to..." />
	<Command.List>
		<Command.Empty>No group found.</Command.Empty>
		<Command.Group>
			{#if collection.groupId}
				<Command.Item
					value="collection"
					onSelect={() => {
						dispatch('updCollection', { id, field: 'groupId', value: null });
						closeMoveDialog();
						closeSmallScreenDrawer();
					}}
				>
					<Database class="icon-sm" />
					<span> Collection</span>
				</Command.Item>
			{/if}
			{#each groups as group (group.id)}
				{#if group.id != collection.groupId}
					<Command.Item
						value={group.name}
						onSelect={() => {
							dispatch('updCollection', { id, field: 'groupId', value: group.id });
							closeMoveDialog();
							closeSmallScreenDrawer();
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
