<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Trash from '@lucide/svelte/icons/trash';
	import Scroll from '@lucide/svelte/icons/scroll';
	import Star from '@lucide/svelte/icons/star';
	import StarOff from '@lucide/svelte/icons/star-off';
	import Layers from '@lucide/svelte/icons/layers';
	import type { Collection } from '@prisma/client';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import { getCollectionState } from './index.js';
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

	async function toggleMode() {
		wrapper.close();
		await collectionState.updCollection({
			id: collection.id,
			itemsOnly: !collection.itemsOnly
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

	<Button theme="ghost" variant="menu" onclick={() => toggleMode()}>
		{#if collection.itemsOnly}
			<Scroll />
			<span> Switch to document view </span>
		{:else}
			<Layers />
			<span> Switch to items view </span>
		{/if}
	</Button>

	<Button theme="ghost" variant="menu" onclick={() => duplicateCollection()}>
		<Copy />
		<span>Duplicate</span>
	</Button>

	<HSeparator />

	<Button theme="danger" variant="menu" onclick={() => deleteCollection()}>
		<Trash />
		<span>Delete</span>
	</Button>
</AdaptiveWrapper>
