<script lang="ts">
	import { ChevronRight, MoreHorizontal, Pencil, Plus, Trash } from 'lucide-svelte';
	import { getScreenSizeState } from '$lib/components/screen';
	import { Button, buttonVariants } from '$lib/components/base/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		getCrtCollectionModalState,
		getDeleteModalState,
		ModalState
	} from '$lib/states/index.js';
	import { nameSchema } from '$lib/schema';
	import { getGroupState } from '$lib/components/group';
	import Menu from '../base/menu.svelte';

	type Props = {
		id: string;
	};

	let { id }: Props = $props();

	const groupState = getGroupState();
	const group = $derived.by(() => {
		return groupState.getGroup(id)!;
	});

	let renameError = $state<string | null>(null);
	const renameGroupModal = new ModalState();
	const smallScreenDrawer = new ModalState();

	const crtCollectionModal = getCrtCollectionModalState();
	const deleteModal = getDeleteModalState();

	const isLargeScreen = getScreenSizeState();

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
		groupState.updGroup({ id, data: { name } });
		renameGroupModal.close();
	}

	function deleteGroup() {
		deleteModal.open({
			type: 'group',
			id,
			name: group.name,
			fun: async () => {
				await groupState.deleteGroup(id);
			}
		});
	}
</script>

<Menu
	align="start"
	bind:open={smallScreenDrawer.isOpen}
	triggerClass={buttonVariants({
		theme: 'ghost',
		variant: 'compact',
		className: 'invisible group-hover:visible transition-opacity'
	})}
>
	{#snippet trigger()}
		<MoreHorizontal />
	{/snippet}
	<Button theme="ghost" variant="menu" onclick={() => crtCollectionModal.open(id)}>
		<Plus />
		<span>New collection</span>
	</Button>

	<Button
		theme="ghost"
		variant="menu"
		onclick={() => {
			renameGroupModal.open();
			smallScreenDrawer.close();
		}}
	>
		<Pencil />
		<span> Rename </span>
	</Button>

	<Button theme="danger" variant="menu" onclick={() => deleteGroup()}>
		<Trash />
		<span>Delete</span>
	</Button>
</Menu>

<Dialog.Root bind:open={renameGroupModal.isOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Rename group</Dialog.Title>
		</Dialog.Header>
		<form onsubmit={handleSubmitRename} class="flex flex-col space-y-2">
			<label for="group-name"> Name </label>
			<input
				id="group-name"
				type="text"
				name="name"
				autocomplete="off"
				value={group.name}
				class="input"
			/>

			{#if renameError}
				<span class="text-error"> {renameError}</span>
			{/if}

			<Button type="submit" class="w-full">Save</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
