<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import CornerUpRight from 'lucide-svelte/icons/corner-up-right';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import Trash from 'lucide-svelte/icons/trash';
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

	function duplicateCollection() {
		wrapper.close();
		collectionState.duplicateCollection(collection.id);
	}

	function toggleDescState() {
		wrapper.close();
		collectionState.updCollection({
			id: collection.id,
			isDescHidden: !collection.isDescHidden
		});
	}
	function deleteCollection() {
		wrapper.close();
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

	<Button theme="ghost" variant="menu" onclick={() => toggleDescState()}>
		{#if collection.isDescHidden}
			<Eye />
			<span> Show collection description </span>
		{:else}
			<EyeOff />
			<span> Hide collection description </span>
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
