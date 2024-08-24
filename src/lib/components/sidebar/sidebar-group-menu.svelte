<script lang="ts">
	import { ChevronRight, MoreHorizontal, Pencil, Plus, Trash } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { getScreenState } from '$lib/components/view';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import { getCrtCollectionDialogState } from '$lib/components/modal';
	import { nameSchema } from '$lib/schema';

	export let id: string;
	export let name: string;

	let isSmallScrenDrawerOpen = false;
	let isRenameGroupDialogOpen = false;

	let renameError: string | null = null;

	const crtCollectionDialog = getCrtCollectionDialogState();

	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		addNewCollection: { name: string; groupId: string };
		renameGroup: { name: string; groupId: string };
		clickDeleteGroup: { id: string; name: string };
	}>();

	function handleSubmitRename(e: { currentTarget: HTMLFormElement }) {
		const formData = new FormData(e.currentTarget);
		const name = formData.get('name') as string;

		const parseResult = nameSchema.safeParse(name);

		if (!parseResult.success) {
			renameError = parseResult.error.issues[0].message;
			return;
		}

		renameError = null;
		dispatch('renameGroup', { groupId: id, name });
		closeRenameDialog();
	}

	function clickCreateCollection() {
		$crtCollectionDialog.defaultGroup = id;
		$crtCollectionDialog.open = true;
	}

	function openRenameGroupDialog() {
		isRenameGroupDialogOpen = true;
	}
	function closeRenameDialog() {
		isRenameGroupDialogOpen = false;
	}

	function openSmallScreenDrawer() {
		isSmallScrenDrawerOpen = true;
	}
	function closeSmallScreenDrawer() {
		isSmallScrenDrawerOpen = false;
	}
</script>

<div>
	{#if $isDesktop}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="ghost"
					size="xs"
					class="invisible group-hover:visible transition-opacity"
				>
					<MoreHorizontal class="icon-xs" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-56">
				<DropdownMenu.Item on:click={clickCreateCollection}>
					<Plus class="icon-xs" />
					<span>New collection</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={openRenameGroupDialog}>
					<Pencil class="icon-xs" />
					<span> Rename </span>
				</DropdownMenu.Item>

				<DropdownMenu.Item
					on:click={() => dispatch('clickDeleteGroup', { id, name })}
					class="group"
				>
					<Trash class="icon-xs group-hover:text-primary" />
					<span class="group-hover:text-primary">Delete</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<Drawer.Root bind:open={isSmallScrenDrawerOpen}>
			<Drawer.Trigger asChild let:builder>
				<Button builders={[builder]} variant="ghost" size="xs">
					<MoreHorizontal class="icon-xs" />
				</Button>
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header class="py-2">
					<div class="flex items-center space-x-2">
						<div class="p-2.5 rounded bg-secondary">
							<ChevronRight class="icon-sm" />
						</div>

						<div class=" text-base font-semibold truncate">{name}</div>
					</div>
				</Drawer.Header>
				<Drawer.Footer class="pt-2">
					<Button
						variant="secondary"
						on:click={() => {
							openRenameGroupDialog();
							closeSmallScreenDrawer();
						}}
					>
						<Pencil class="icon-xs" />
						<span> Rename </span>
					</Button>

					<Button variant="destructive" on:click={() => dispatch('clickDeleteGroup', { id, name })}>
						<Trash class="icon-xs" />
						<span>Delete</span>
					</Button>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
</div>

<Dialog.Root bind:open={isRenameGroupDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Rename group</Dialog.Title>
		</Dialog.Header>
		<form on:submit|preventDefault={handleSubmitRename} class="flex flex-col space-y-2">
			<label for="group-name"> Name </label>
			<input
				id="group-name"
				type="text"
				name="name"
				autocomplete="off"
				value={name}
				class="input"
			/>

			{#if renameError}
				<span class="text-error"> {renameError}</span>
			{/if}

			<Button type="submit" class="w-full">Save</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
