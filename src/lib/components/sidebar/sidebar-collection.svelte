<script lang="ts">
	import type { Collection } from '@prisma/client';
	import Copy from 'lucide-svelte/icons/copy';
	import CornerUpRight from 'lucide-svelte/icons/corner-up-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';
	import { Button, buttonVariants, Dialog, HSeparator, Menu } from '$lib/components/base/index.js';
	import { icons } from '$lib/components/icon';
	import { getSidebarState } from './index.js';
	import { goto } from '$app/navigation';
	import { nameSchema } from '$lib/schema.js';
	import { getScreenSizeState } from '$lib/components/screen/index.js';
	import {
		getDeleteModalState,
		getMoveCollectionModalState,
		ModalState
	} from '$lib/states/index.js';
	import { getCollectionState } from '$lib/components/collection';
	import { MAX_COLLECTION_NAME_LENGTH } from '$lib/constant/index.js';

	type Props = {
		active: boolean;
		asChild?: boolean;
		collection: Collection;
	};

	let { active, asChild = false, collection }: Props = $props();

	let renameError = $state<string | null>(null);

	const collectionState = getCollectionState();
	const Icon = $derived(icons[collection.icon]);

	const renameModalState = new ModalState();
	const menuState = new ModalState();

	const sidebarState = getSidebarState();
	const isLargeScreen = getScreenSizeState();
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
		renameModalState.close();
	}

	function onClickSidebarItem(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		if (e.metaKey || e.ctrlKey || isLargeScreen.current) return;

		const { href } = e.currentTarget;
		sidebarState.close();
		goto(href);
	}

	function moveCollection() {
		menuState.close();
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
			fun: async () => {
				await collectionState.deleteCollection(collection.id);
				if (active) {
					if (history.length === 1) {
						// FIXME: maybe use replace state
						await goto('/collections');
					} else {
						history.back();
					}
				}
			}
		});
	}
</script>

<span
	class={[
		'group flex items-center py-0.5 pl-3.5 pr-0.5  hover:bg-secondary/90  transition duration-75 text-secondary-foreground',
		active && 'border-r-2 border-primary bg-secondary hover:bg-secondary/90',
		asChild && 'pl-5'
	]}
>
	<a
		href="/collections/{collection.id}"
		class="grow flex items-center space-x-1.5"
		onclick={onClickSidebarItem}
	>
		<Icon class={['icon-sm', active && 'text-primary']} />
		<span class={['font-semibold text-base text-nowrap', active && 'text-primary']}>
			{collection.name.length > 25 && isLargeScreen.current
				? collection.name.substring(0, 22) + ' ...'
				: collection.name}
		</span>
	</a>
	{@render menu()}
</span>

<Dialog bind:open={renameModalState.isOpen} title="Rename collection">
	<form onsubmit={handleSubmitRename} class="flex flex-col space-y-2">
		<label for="collection-name"> Name </label>
		<input
			id="collection-name"
			type="text"
			name="name"
			autocomplete="off"
			value={collection.name}
			class="input"
			maxlength={MAX_COLLECTION_NAME_LENGTH}
		/>

		{#if renameError}
			<span class="text-error"> {renameError}</span>
		{/if}

		<Button type="submit" class="w-full">Save</Button>
	</form>
</Dialog>

{#snippet menu()}
	<Menu
		bind:open={menuState.isOpen}
		align="start"
		triggerClass={buttonVariants({
			theme: 'ghost',
			variant: 'compact',
			className: 'invisible group-hover:visible transition-opacity'
		})}
	>
		{#snippet trigger()}
			<Ellipsis />
		{/snippet}

		<Button theme="ghost" variant="menu" onclick={() => renameModalState.open()}>
			<Pencil />
			<span> Rename </span>
		</Button>

		<Button theme="ghost" variant="menu" onclick={() => moveCollection()}>
			<CornerUpRight />
			<span>Move to</span>
		</Button>

		<Button
			theme="ghost"
			variant="menu"
			onclick={() => {
				collectionState.duplicateCollection(collection.id);
				menuState.close();
			}}
		>
			<Copy />
			<span>Duplicate</span>
		</Button>

		<HSeparator />

		<Button
			theme="danger"
			variant="menu"
			onclick={() => {
				menuState.close();
				deleteCollection();
			}}
		>
			<Trash />
			<span>Delete</span>
		</Button>
	</Menu>
{/snippet}
