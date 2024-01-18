<script lang="ts">
	import type { Collection } from '@prisma/client';
	import {
		ArrowLeft,
		Check,
		Copy,
		CornerUpRight,
		Heart,
		HeartOff,
		MoreHorizontal,
		Pencil,
		Trash
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils';
	import { icons } from '$lib/components/icon';
	import { mediaQuery } from 'svelte-legos';
	import { getSidebarState } from './index.js';
	import { goto } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';
	import debounce from 'debounce';
	import { z } from 'zod';

	export let active: boolean;
	export let asChild: boolean = false;
	export let collection: Collection;
	export let groups: { id: string; name: string }[];
	$: ({ id, name, icon } = collection);

	let isRenamePopoverOpen = false;
	let isMoveDialogOpen = false;

	let isSmallScrenDialogOpen = false;

	let renameError: string | null = null;

	const sidebarState = getSidebarState();
	const isDesktop = mediaQuery('(min-width: 768px)');

	const nameSchema = z
		.string()
		.min(1, { message: 'The name must be at least 1 character long' })
		.max(20, { message: 'The name must be at most 20 characters long' });

	const dispatch = createEventDispatcher<{
		updCollection: { id: string; field: keyof Collection; value: string | boolean };
		duplicateCollection: { id: string };
		deleteCollection: { id: string; name: string };
	}>();

	const deboundedUpd = debounce((name: string) => {
		dispatch('updCollection', { id, field: 'name', value: name });
	}, 1000);

	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;

		const parseResult = nameSchema.safeParse(targetEl.value);

		if (!parseResult.success) {
			renameError = parseResult.error.issues[0].message;
			return;
		}

		renameError = null;
		deboundedUpd(parseResult.data);
	}

	// TODO: add validation
	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		e.preventDefault();

		const targetEl = e.target as HTMLInputElement;

		const parseResult = nameSchema.safeParse(targetEl.value);

		if (!parseResult.success) {
			renameError = parseResult.error.issues[0].message;
			return;
		}

		renameError = null;
		dispatch('updCollection', { id, field: 'name', value: parseResult.data });

		isRenamePopoverOpen = false;
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

	function openSmallScreenDialog() {
		isSmallScrenDialogOpen = true;
	}
	function closeSmallScreenDialog() {
		isSmallScrenDialogOpen = false;
	}
</script>

<span
	class={cn(
		'group flex items-center py-0.5 pl-3 pr-0.5  hover:bg-secondary/90  transition duration-75 text-secondary-foreground',
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
		<span class={cn('trucante font-semibold text-base', active && 'text-primary')}>{name}</span>
	</a>

	{#if $isDesktop}
		<Popover.Root bind:open={isRenamePopoverOpen}>
			<Popover.Trigger class="sr-only">Open</Popover.Trigger>
			<Popover.Content>
				<form class="w-full">
					<label for="name" class=" sr-only"> Name </label>
					<input
						id="name"
						value={name}
						name="name"
						class="input input-ghost"
						on:keydown={handleKeydown}
						on:input={handleOnInput}
					/>
					{#if renameError}
						<span> {renameError}</span>
					{/if}
				</form>
			</Popover.Content>
		</Popover.Root>
	{/if}

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
				<DropdownMenu.Item class="space-x-2" on:click={() => (isRenamePopoverOpen = true)}>
					<Pencil class="icon-xs" />
					<span> Rename </span>
				</DropdownMenu.Item>

				<DropdownMenu.Item
					class="space-x-2"
					on:click={() => {
						dispatch('updCollection', { id, field: 'isFavourite', value: !collection.isFavourite });
					}}
				>
					{#if collection.isFavourite}
						<HeartOff class="icon-xs" />
						<span> Remove from Favourites </span>
					{:else}
						<Heart class="icon-xs" />
						<span> Add to Favourites </span>
					{/if}
				</DropdownMenu.Item>

				<DropdownMenu.Item class="space-x-2" on:click={openMoveDialog}>
					<CornerUpRight class="icon-xs" />
					<span>Move to</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item
					class="space-x-2"
					on:click={() => dispatch('duplicateCollection', { id })}
				>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item
					class="space-x-2"
					on:click={() => dispatch('deleteCollection', { id, name })}
				>
					<Trash class="icon-xs" />
					<span>Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}

	{#if !$isDesktop}
		<Button size="icon" variant="ghost" on:click={openSmallScreenDialog}>
			<MoreHorizontal class="icon-xs" />
		</Button>
	{/if}
</span>

<Command.Dialog bind:open={isMoveDialogOpen}>
	<Command.Input placeholder="Move collection to..." />
	<Command.List>
		<Command.Empty>No group found.</Command.Empty>
		<Command.Group>
			{#each groups as group (group.id)}
				<Command.Item
					value={group.name}
					onSelect={() => {
						dispatch('updCollection', { id, field: 'groupId', value: group.id });
						closeMoveDialog();
						closeSmallScreenDialog();
					}}
					class="space-x-2"
				>
					<Check class={cn('icon-xxs', group.id !== collection.groupId && 'text-transparent')} />

					<span> {group.name} </span>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>

{#if !$isDesktop}
	<Dialog.Root bind:open={isSmallScrenDialogOpen}>
		<Dialog.Content>
			<div class="flex items-center space-x-2">
				<Button size="icon" variant="secondary" on:click={closeSmallScreenDialog}>
					<ArrowLeft />
				</Button>
				<h1 class="font-semibold text-lg">Collection</h1>
			</div>
			<form class="w-full">
				<label for="name" class="sr-only">New name </label>
				<input
					id="name"
					value={name}
					name="name"
					class="input input-ghost"
					on:keydown={handleKeydown}
					on:input={handleOnInput}
				/>
				{#if renameError}
					<span> {renameError}</span>
				{/if}
			</form>

			<div class="w-full flex flex-col space-y-2">
				<Button
					variant="secondary"
					on:click={() => {
						dispatch('updCollection', { id, field: 'isFavourite', value: !collection.isFavourite });
						closeSmallScreenDialog();
					}}
				>
					{#if collection.isFavourite}
						<HeartOff class="icon-xs" />
						<span> Remove from Favourites </span>
					{:else}
						<Heart class="icon-xs" />
						<span> Add to Favourites </span>
					{/if}
				</Button>
				<Button variant="secondary" on:click={openMoveDialog}>
					<CornerUpRight class="icon-xs" />
					<span>Move to</span>
				</Button>
				<Button
					variant="secondary"
					on:click={() => {
						dispatch('duplicateCollection', { id });
						closeSmallScreenDialog();
					}}
				>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</Button>
			</div>

			<div class="flex flex-col">
				<Button
					variant="destructive"
					on:click={() => {
						closeSmallScreenDialog();
						dispatch('deleteCollection', { id, name });
					}}
				>
					<Trash class="icon-xs" />
					<span>Delete</span>
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
