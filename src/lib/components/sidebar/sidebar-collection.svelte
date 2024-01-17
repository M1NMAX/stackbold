<script lang="ts">
	import type { Collection } from '@prisma/client';
	import {
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
	import * as Drawer from '$lib/components/ui/drawer';

	export let active: boolean;
	export let asChild: boolean = false;
	export let collection: Collection;
	export let groups: { id: string; name: string }[];
	$: ({ id, name, icon } = collection);

	let isDrawerOpen = false;
	let isRenamePopoverOpen = false;
	let isGroupComboboxOpen = false;

	const isDesktop = mediaQuery('(min-width: 768px)');
	const sidebarState = getSidebarState();

	const dispatch = createEventDispatcher<{
		duplicateCollection: { id: string };
		renameCollection: { id: string; name: string };
		moveCollection: { id: string; groupId: string };
		toggleFavourite: { id: string; value: boolean };
		deleteCollection: { id: string; name: string };
	}>();

	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		dispatch('renameCollection', { id, name: targetEl.value });
	}

	// TODO: maybe couple this with on input for realibility
	// TODO: add validation
	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		e.preventDefault();

		const value = (e.target as HTMLInputElement).value;
		dispatch('renameCollection', { id, name: value });
		isRenamePopoverOpen = false;
	}

	function onClickSidebarItem(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		if (e.metaKey || e.ctrlKey || $isDesktop) return;

		const { href } = e.currentTarget;
		$sidebarState = false;
		goto(href);
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

	<Popover.Root bind:open={isGroupComboboxOpen}>
		<Popover.Trigger class="sr-only">Open available group list</Popover.Trigger>
		<Popover.Content class="w-[200px] p-0">
			<Command.Root>
				<Command.Input placeholder="Search groups..." />
				<Command.Empty>No group found.</Command.Empty>
				<Command.Group>
					{#each groups as group (group.id)}
						<Command.Item
							value={group.name}
							onSelect={() => dispatch('moveCollection', { id, groupId: group.id })}
							class="space-x-2"
						>
							<Check
								class={cn('icon-xxs', group.id !== collection.groupId && 'text-transparent')}
							/>

							<span> {group.name} </span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>

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
				/>
			</form>
		</Popover.Content>
	</Popover.Root>

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
						dispatch('toggleFavourite', { id, value: !collection.isFavourite });
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

				<DropdownMenu.Item class="space-x-2" on:click={() => (isGroupComboboxOpen = true)}>
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
		<Button size="icon" variant="ghost" on:click={() => (isDrawerOpen = true)}>
			<MoreHorizontal />
		</Button>
	{/if}
</span>

{#if !$isDesktop}
	<Drawer.Root bind:open={isDrawerOpen}>
		<Drawer.Content>
			<Drawer.Header>
				<form class="w-full">
					<label for="name" class=" sr-only"> Name </label>
					<input id="name" value={name} name="name" class="input" on:keydown={handleKeydown} />
				</form>
			</Drawer.Header>
			<Drawer.Footer>
				<Button
					variant="secondary"
					on:click={() => {
						dispatch('toggleFavourite', { id, value: !collection.isFavourite });
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
				<Button variant="secondary" on:click={() => dispatch('duplicateCollection', { id })}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</Button>
				<Button variant="secondary" on:click={() => dispatch('deleteCollection', { id, name })}>
					<Trash class="icon-xs" />
					<span>Delete</span>
				</Button>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
