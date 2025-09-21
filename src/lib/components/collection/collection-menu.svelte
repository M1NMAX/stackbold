<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import CornerUpRight from 'lucide-svelte/icons/corner-up-right';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import Trash from 'lucide-svelte/icons/trash';
	import Star from 'lucide-svelte/icons/star';
	import StarOff from 'lucide-svelte/icons/star-off';
	import type { Collection } from '@prisma/client';
	import {
		getDeleteModalState,
		getMoveCollectionModalState,
		ModalState
	} from '$lib/states/index.js';
	import { getCollectionState } from '.';
	import { goto } from '$app/navigation';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		HSeparator
	} from '$lib/components/base/index.js';

	type Props = {
		collection: Collection;
	};

	let { collection }: Props = $props();

	let wrapper = new ModalState();

	const collectionState = getCollectionState();
	const moveCollectionModal = getMoveCollectionModalState();
	const deleteModal = getDeleteModalState();

	async function duplicateCollection() {
		wrapper.close();
		await collectionState.duplicateCollection(collection.id);
	}

	async function toggleFavState() {
		wrapper.close();
		await collectionState.updCollection({
			id: collection.id,
			isPinned: !collection.isPinned
		});
	}

	async function toggleDescState() {
		wrapper.close();
		await collectionState.updCollection({
			id: collection.id,
			isDescHidden: !collection.isDescHidden
		});
	}
	async function deleteCollection() {
		wrapper.close();
		deleteModal.open({
			type: 'collection',
			id: collection.id,
			name: collection.name,
			fun: async () => await collectionState.deleteCollection(collection.id, true)
		});
	}

	function moveCollection() {
		wrapper.close();
		moveCollectionModal.open({
			collectionId: collection.id,
			currentGroupId: collection.groupId
		});
	}
</script>

<AdaptiveWrapper
	bind:open={wrapper.isOpen}
	floatingAlign="end"
	triggerClass={buttonVariants({ theme: 'secondary', variant: 'icon' })}
>
	{#snippet trigger()}
		<Ellipsis />
	{/snippet}

	<Button theme="ghost" variant="menu" onclick={() => toggleFavState()}>
		{#if collection.isPinned}
			<StarOff />
			<span> Remove from favorites </span>
		{:else}
			<Star />
			<span> Add to favorites </span>
		{/if}
	</Button>

	<Button theme="ghost" variant="menu" onclick={() => toggleDescState()}>
		{#if collection.isDescHidden}
			<Eye />
			<span> Show description </span>
		{:else}
			<EyeOff />
			<span> Hide description </span>
		{/if}
	</Button>

	<Button theme="ghost" variant="menu" onclick={() => moveCollection()}>
		<CornerUpRight />
		<span>Move collection</span>
	</Button>

	<Button theme="ghost" variant="menu" onclick={() => duplicateCollection()}>
		<Copy />
		<span>Duplicate collection </span>
	</Button>

	<HSeparator />

	<Button theme="danger" variant="menu" onclick={() => deleteCollection()}>
		<Trash />
		<span>Delete collection</span>
	</Button>
</AdaptiveWrapper>
