<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Copy, CornerUpRight, Eye, EyeOff, MoreHorizontal, Trash } from 'lucide-svelte';
	import type { Collection } from '@prisma/client';
	import { icons } from '$lib/components/icon';
	import {
		getDeleteModalState,
		getMoveCollectionModalState,
		ModalState
	} from '$lib/components/modal';
	import { getCollectionState } from '.';
	import { getGroupState } from '$lib/components/group';
	import { getScreenState } from '$lib/components/screen';
	import { goto } from '$app/navigation';

	type Props = {
		collection: Collection;
	};

	let { collection }: Props = $props();

	let wrapper = new ModalState();

	const Icon = $derived(icons[collection.icon]);

	const collectionState = getCollectionState();
	const groupState = getGroupState();
	const moveCollectionModal = getMoveCollectionModalState();
	const deleteModal = getDeleteModalState();
	const isDesktop = getScreenState();

	const groupName = $derived.by(() => {
		return groupState.groups.find((group) => group.id === collection.id)?.name ?? 'without group';
	});

	function duplicateCollection() {
		closeIfOpen();
		collectionState.duplicateCollection(collection.id);
	}

	function toggleDescState() {
		closeIfOpen();
		collectionState.updCollection({
			id: collection.id,
			data: { isDescHidden: !collection.isDescHidden }
		});
	}
	function deleteCollection() {
		closeIfOpen();
		deleteModal.open({
			type: 'collection',
			id: collection.id,
			name: collection.name,
			fun: async () => {
				await collectionState.deleteCollection(collection.id);
				if (history.length === 1) {
					// FIXME: maybe use replace state
					await goto('/collections');
				} else {
					history.back();
				}
			}
		});
	}

	function moveCollection() {
		closeIfOpen();
		moveCollectionModal.open({
			collectionId: collection.id,
			currentGroupId: collection.groupId
		});
	}

	function closeIfOpen() {
		if (wrapper.isOpen) wrapper.close();
	}
</script>

{#if $isDesktop}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={buttonVariants({ variant: 'secondary', size: 'icon', className: 'hidden md:flex' })}
		>
			<MoreHorizontal />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			<DropdownMenu.Group>
				<DropdownMenu.Item onclick={() => toggleDescState()}>
					{#if collection.isDescHidden}
						<Eye class="icon-xs" />
						<span> Show description </span>
					{:else}
						<EyeOff class="icon-xs" />
						<span> Hide description </span>
					{/if}
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => moveCollection()}>
					<CornerUpRight class="icon-xs" />
					<span>Move to</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item onclick={() => duplicateCollection()}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => deleteCollection()}>
					<Trash class="icon-xs text-red-500" />
					<span class="text-red-500">Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<Drawer.Root bind:open={wrapper.isOpen}>
		<Drawer.Trigger class={buttonVariants({ variant: 'secondary', className: 'md:hidden' })}>
			<MoreHorizontal class="icon-sm" />
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
							{groupName ?? 'Without group'}
						</div>
					</div>
				</div>
			</Drawer.Header>
			<Drawer.Footer class="pt-2">
				<Button variant="secondary" onclick={() => toggleDescState()}>
					{#if collection.isDescHidden}
						<Eye class="icon-xs" />
						<span> Show description </span>
					{:else}
						<EyeOff class="icon-xs" />
						<span> Hide description </span>
					{/if}
				</Button>
				<Button variant="secondary" onclick={() => moveCollection()}>
					<CornerUpRight class="icon-xs" />
					<span>Move to</span>
				</Button>
				<Button variant="secondary" onclick={() => duplicateCollection()}>
					<Copy class="icon-xs" />
					<span>Duplicate</span>
				</Button>
				<Button variant="destructive" onclick={() => deleteCollection()}>
					<Trash class="icon-xs" />
					<span>Delete</span>
				</Button>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
