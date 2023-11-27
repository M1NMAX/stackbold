<script lang="ts">
	import type { Collection } from '@prisma/client';
	import {
		Copy,
		CornerUpRight,
		Folder,
		Heart,
		HeartOff,
		MoreHorizontal,
		Pencil,
		Trash
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';
	import { createEventDispatcher } from 'svelte';

	export let collection: Collection;
	export let active: boolean;
	let isRenamePopoverOpen = false;

	const dispatch = createEventDispatcher<{
		renameCollection: { id: string; name: string };
		toggleFavourite: { id: string; value: boolean };
		duplicateCollection: { id: string };
		deleteCollection: { id: string };
	}>();

	const handleOnInput = (e: Event) => {
		const targetEl = e.target as HTMLInputElement;
		dispatch('renameCollection', { id: collection.id, name: targetEl.value });
	};

	// TODO: maybe couple this with on input for realibility
	// TODO: add validation
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			const value = (e.target as HTMLInputElement).value;
			dispatch('renameCollection', { id: collection.id, name: value });
			isRenamePopoverOpen = false;
		}
	};
</script>

<span
	class={`${
		active && 'border-r-2 border-primary bg-secondary hover:bg-secondary/90'
	} group flex items-center py-0.5 pl-4 pr-0.5  hover:bg-secondary/90   transition duration-75 text-secondary-foreground`}
>
	<a href={`/collections/${collection.id}`} class="grow flex items-center space-x-1.5">
		<Folder class="icon-xs" />
		<span class="trucante font-semibold text-base">{collection.name}</span>
	</a>

	<Popover.Root bind:open={isRenamePopoverOpen}>
		<Popover.Trigger class="sr-only">Open</Popover.Trigger>
		<Popover.Content>
			<form class="space-y-1">
				<div class="flex space-x-1.5">
					<label for="name" class=" sr-only"> Name </label>
					<input
						id="name"
						value={collection.name}
						name="name"
						class="grow input input-ghost px-1 font-semibold text-sm bg-base-200"
						on:keydown={handleKeydown}
					/>
				</div>
			</form>
		</Popover.Content>
	</Popover.Root>

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
					dispatch('toggleFavourite', { id: collection.id, value: !collection.isFavourite });
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

			<DropdownMenu.Item class="space-x-2" disabled>
				<CornerUpRight class="icon-xs" />
				<span>Move to</span>
			</DropdownMenu.Item>

			<DropdownMenu.Item
				class="space-x-2"
				on:click={() => {
					dispatch('duplicateCollection', { id: collection.id });
				}}
			>
				<Copy class="icon-xs" />
				<span>Duplicate</span>
			</DropdownMenu.Item>

			<DropdownMenu.Item
				class="space-x-2"
				on:click={() => {
					dispatch('deleteCollection', { id: collection.id });
				}}
			>
				<Trash class="icon-xs" />
				<span>Delete</span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</span>
