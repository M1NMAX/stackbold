<script lang="ts">
	import { ChevronRight, MoreHorizontal, Pencil, Plus, Trash } from 'lucide-svelte';
	import { getScreenSizeState } from '$lib/components/screen';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		getCrtCollectionModalState,
		getDeleteModalState,
		ModalState
	} from '$lib/components/modal';
	import { nameSchema } from '$lib/schema';
	import { getGroupState } from '$lib/components/group';

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

<div>
	{#if isLargeScreen.current}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={buttonVariants({
					variant: 'ghost',
					size: 'xs',
					className: 'invisible group-hover:visible transition-opacity'
				})}
			>
				<MoreHorizontal class="icon-xs" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-56">
				<DropdownMenu.Item onclick={() => crtCollectionModal.open(id)}>
					<Plus class="icon-xs" />
					<span>New collection</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item onclick={() => renameGroupModal.open()}>
					<Pencil class="icon-xs" />
					<span> Rename </span>
				</DropdownMenu.Item>

				<DropdownMenu.Item onclick={() => deleteGroup()} class="group">
					<Trash class="icon-xs group-hover:text-primary" />
					<span class="group-hover:text-primary">Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<Drawer.Root bind:open={smallScreenDrawer.isOpen}>
			<Drawer.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
				<MoreHorizontal class="icon-xs" />
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header class="py-2">
					<div class="flex items-center space-x-2">
						<div class="p-2.5 rounded bg-secondary">
							<ChevronRight class="icon-sm" />
						</div>

						<div class=" text-base font-semibold truncate">{group.name}</div>
					</div>
				</Drawer.Header>
				<Drawer.Footer class="pt-2">
					<Button
						variant="secondary"
						onclick={() => {
							renameGroupModal.open();
							smallScreenDrawer.close();
						}}
					>
						<Pencil class="icon-xs" />
						<span> Rename </span>
					</Button>

					<Button variant="destructive" onclick={() => deleteGroup()}>
						<Trash class="icon-xs" />
						<span>Delete</span>
					</Button>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
</div>

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
