<script lang="ts">
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash from 'lucide-svelte/icons/trash';
	import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';
	import type { Group } from '@prisma/client';
	import { tm } from '$lib/utils/index.js';
	import { getCollectionState } from '$lib/components/collection/index.js';
	import { MAX_GROUP_NAME_LENGTH, NEW_COLLECTION_NAME } from '$lib/constant/index.js';
	import { getGroupState } from '$lib/components/group/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import { AdaptiveWrapper, Button, buttonVariants } from '$lib/components/base/index.js';
	import { tick } from 'svelte';
	import { clickOutside, enterKeydown, escapeKeydown } from '$lib/actions/index.js';
	import type { UpdGroup } from '$lib/types.js';

	type Props = {
		group: Group;
		isOpen: boolean;
		toggle: () => void;
	};

	let { group, isOpen, toggle }: Props = $props();

	const groupState = getGroupState();
	const collectionState = getCollectionState();
	const deleteModal = getDeleteModalState();
	const menuState = new ModalState();

	let isRenaming = $state(false);

	async function createCollection() {
		await collectionState.createCollection({ name: NEW_COLLECTION_NAME, groupId: group.id }, true);
	}

	async function updGroup(group: UpdGroup) {
		await groupState.updGroup(group);
	}

	async function deleteGroup() {
		deleteModal.open({
			type: 'group',
			id: group.id,
			name: group.name,
			fun: async () => {
				await groupState.deleteGroup(group.id);
			}
		});
	}

	async function saveName(name: string) {
		isRenaming = false;
		if (group.name === name) return;
		await updGroup({ id: group.id, name });
	}

	function startRenaming() {
		menuState.close();
		isRenaming = true;
	}

	$effect(() => {
		if (!isRenaming) return;
		tick().then(() => {
			document.getElementById(`group-${group.id}-rename`)?.focus();
		});
	});
</script>

<div class="w-full relative group hover:bg-secondary">
	{#if isRenaming}
		<div class="px-2">
			<input
				use:clickOutside
				use:escapeKeydown
				use:enterKeydown
				id={`group-${group.id}-rename`}
				type="text"
				name="name"
				autocomplete="off"
				value={group.name}
				class="input"
				maxlength={MAX_GROUP_NAME_LENGTH}
				onclickoutside={(e) => saveName((e.target as HTMLInputElement).value)}
				onescapekey={() => (isRenaming = false)}
				onenterkey={(e) => saveName((e.target as HTMLInputElement).value)}
			/>
		</div>
	{:else}
		<button onclick={toggle} aria-expanded={isOpen} class="w-full flex items-center gap-1.5 px-2.5">
			<ChevronRight
				class={tm('size-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-90')}
			/>
			<span>
				{group.name}
			</span>
		</button>

		<AdaptiveWrapper
			floatingAlign="start"
			bind:open={menuState.isOpen}
			triggerClass={buttonVariants({
				theme: 'ghost',
				variant: 'compact',
				className: 'absolute top-0 right-1 invisible group-hover:visible transition-opacity'
			})}
		>
			{#snippet trigger()}
				<MoreHorizontal />
			{/snippet}
			<Button theme="ghost" variant="menu" onclick={() => createCollection()}>
				<Plus />
				<span>New collection</span>
			</Button>

			<Button theme="ghost" variant="menu" onclick={() => startRenaming()}>
				<Pencil />
				<span> Rename group </span>
			</Button>

			<Button theme="danger" variant="menu" onclick={() => deleteGroup()}>
				<Trash />
				<span>Delete group </span>
			</Button>
		</AdaptiveWrapper>
	{/if}
</div>
