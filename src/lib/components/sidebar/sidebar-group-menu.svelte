<script lang="ts">
	import Pencil from 'lucide-svelte/icons/pencil';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash from 'lucide-svelte/icons/trash';
	import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';
	import { AdaptiveWrapper, Button, buttonVariants, Dialog } from '$lib/components/base/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import { nameSchema } from '$lib/schema';
	import { getGroupState } from '$lib/components/group';

	type Props = {
		id: string;
		createCollection: (id: string) => void;
	};

	let { id, createCollection }: Props = $props();

	const groupState = getGroupState();
	const group = $derived.by(() => {
		return groupState.getGroup(id)!;
	});

	let renameError = $state<string | null>(null);
	const renameGroupModal = new ModalState();
	const smallScreenDrawer = new ModalState();

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
		groupState.updGroup({ id, name });
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

<AdaptiveWrapper
	floatingAlign="start"
	bind:open={smallScreenDrawer.isOpen}
	triggerClass={buttonVariants({
		theme: 'ghost',
		variant: 'compact',
		className: 'absolute top-0 right-1 invisible group-hover:visible transition-opacity'
	})}
>
	{#snippet trigger()}
		<MoreHorizontal />
	{/snippet}
	<Button theme="ghost" variant="menu" onclick={() => createCollection(id)}>
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
		<span> Rename group </span>
	</Button>

	<Button theme="danger" variant="menu" onclick={() => deleteGroup()}>
		<Trash />
		<span>Delete group </span>
	</Button>
</AdaptiveWrapper>

<Dialog bind:open={renameGroupModal.isOpen} title="Rename group">
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
</Dialog>
