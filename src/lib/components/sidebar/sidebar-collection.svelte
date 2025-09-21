<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import CornerUpRight from 'lucide-svelte/icons/corner-up-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';
	import StarOff from 'lucide-svelte/icons/star-off';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		HSeparator
	} from '$lib/components/base/index.js';
	import { getSidebarState } from './index.js';
	import { goto } from '$app/navigation';
	import {
		getDeleteModalState,
		getMoveCollectionModalState,
		ModalState
	} from '$lib/states/index.js';
	import { getCollectionState, getCollectionView } from '$lib/components/collection/index.js';
	import {
		COLLECTION_ICONS,
		MAX_COLLECTION_NAME_LENGTH,
		SCREEN_LG_MEDIA_QUERY
	} from '$lib/constant/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { tm } from '$lib/utils/index.js';
	import type { CollectionWithViews } from '$lib/types.js';
	import { clickOutside } from '$lib/actions/clickOutside.svelte.js';
	import { escapeKeydown } from '$lib/actions/escapeKeydown.svelte.js';
	import { enterKeydown } from '$lib/actions/enterKeydown.svelte.js';
	import { tick } from 'svelte';

	type Props = {
		active: boolean;
		asChild?: boolean;
		collection: CollectionWithViews;
	};

	let { active, asChild = false, collection }: Props = $props();

	const collectionState = getCollectionState();
	const Icon = $derived(COLLECTION_ICONS[collection.icon]);

	const isLargeScreen = new MediaQuery(SCREEN_LG_MEDIA_QUERY);
	const sidebarState = getSidebarState();
	const moveCollectionModal = getMoveCollectionModalState();
	const deleteModal = getDeleteModalState();
	const menuState = new ModalState();

	let isRenaming = $state(false);

	async function removeFromFavorites() {
		await collectionState.updCollection({ id: collection.id, isPinned: false });
	}

	async function saveName(name: string) {
		isRenaming = false;
		if (collection.name === name) return;
		await collectionState.updCollection({ id: collection.id, name });
	}

	function startRenaming() {
		menuState.close();
		isRenaming = true;
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

	$effect(() => {
		if (!isRenaming) return;

		tick().then(() => {
			document.getElementById(`collection-${collection.id}-rename`)?.focus();
		});
	});
</script>

{#if isRenaming}
	<div class={tm('py-0.5 pr-0.5', asChild ? 'pl-5' : 'pl-2.5')}>
		<input
			use:clickOutside
			use:escapeKeydown
			use:enterKeydown
			id={`collection-${collection.id}-rename`}
			type="text"
			name="name"
			autocomplete="off"
			value={collection.name}
			class="input"
			maxlength={MAX_COLLECTION_NAME_LENGTH}
			onclickoutside={(e) => saveName((e.target as HTMLInputElement).value)}
			onescapekey={() => (isRenaming = false)}
			onenterkey={(e) => saveName((e.target as HTMLInputElement).value)}
		/>
	</div>
{:else}
	<span
		class={[
			'group flex items-center py-0.5 pl-2.5 pr-0.5  hover:bg-secondary/90  transition duration-75 text-secondary-foreground',
			active && 'border-r-2 border-primary bg-secondary hover:bg-secondary/90',
			asChild && 'pl-8'
		]}
	>
		<a
			href="/collections/{collection.id}?view={getCollectionView(collection)}"
			class="grow flex items-center space-x-1.5"
			onclick={onClickSidebarItem}
		>
			<Icon class={tm('size-5', active && 'text-primary')} />
			<span class={['font-semibold text-base text-nowrap', active && 'text-primary']}>
				{collection.name.length > 25 && isLargeScreen.current
					? collection.name.substring(0, 22) + ' ...'
					: collection.name}
			</span>
		</a>
		{@render menu()}
	</span>
{/if}
{#snippet menu()}
	<AdaptiveWrapper
		bind:open={menuState.isOpen}
		floatingAlign="start"
		triggerClass={buttonVariants({
			theme: 'ghost',
			variant: 'compact',
			className: 'invisible group-hover:visible transition-opacity'
		})}
	>
		{#snippet trigger()}
			<Ellipsis />
		{/snippet}

		<Button theme="ghost" variant="menu" onclick={() => removeFromFavorites()}>
			<StarOff />
			<span> Remove from favorites </span>
		</Button>

		<HSeparator />

		<Button theme="ghost" variant="menu" onclick={() => startRenaming()}>
			<Pencil />
			<span> Rename collection </span>
		</Button>

		<Button theme="ghost" variant="menu" onclick={() => moveCollection()}>
			<CornerUpRight />
			<span>Move collection</span>
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
			<span>Duplicate collection </span>
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
			<span>Delete collection </span>
		</Button>
	</AdaptiveWrapper>
{/snippet}
