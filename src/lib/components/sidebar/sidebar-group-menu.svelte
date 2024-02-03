<script lang="ts">
	import { ChevronRight, MoreHorizontal, Pencil, Plus, Trash } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { getScreenState } from '$lib/components/view';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Dialog from '$lib/components/ui/dialog';
	import { z } from 'zod';

	export let id: string;
	export let name: string;

	let isPopoverOpen = false;
	let isNewCollection = false;
	let isSmallScrenDrawerOpen = false;
	let isRenameGroupDialogOpen = false;

	let renameError: string | null = null;

	const nameSchema = z
		.string()
		.min(1, { message: 'The name must be at least 1 character long' })
		.max(20, { message: 'The name must be at most 20 characters long' });

	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		addNewCollection: { name: string; groupId: string };
		renameGroup: { name: string; groupId: string };
		clickDeleteGroup: { id: string; name: string };
	}>();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;

		e.preventDefault();

		const targetEl = e.target as HTMLInputElement;

		if (isNewCollection) dispatch('addNewCollection', { name: targetEl.value, groupId: id });
		else dispatch('renameGroup', { name: targetEl.value, groupId: id });
		isPopoverOpen = false;
	}

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
	<Popover.Root bind:open={isPopoverOpen}>
		<Popover.Trigger class="sr-only">Open</Popover.Trigger>
		<Popover.Content class="p-1">
			<form class="space-y-1">
				<div class="flex space-x-1.5">
					<label for="name" class=" sr-only"> Name </label>

					<input
						id="name"
						name="name"
						placeholder="Tasks, ToDo ..."
						class="grow input input-ghost px-1 font-semibold text-sm"
						on:keydown={handleKeydown}
					/>
				</div>
			</form>
		</Popover.Content>
	</Popover.Root>

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
				<DropdownMenu.Item
					on:click={() => {
						isPopoverOpen = true;
						isNewCollection = true;
					}}
					class="space-x-2"
				>
					<Plus class="icon-xs" />
					<span>New collection</span>
				</DropdownMenu.Item>

				<DropdownMenu.Item on:click={openRenameGroupDialog} class="space-x-2">
					<Pencil class="icon-xs" />
					<span> Rename </span>
				</DropdownMenu.Item>

				<DropdownMenu.Separator />
				<DropdownMenu.Item
					on:click={() => dispatch('clickDeleteGroup', { id, name })}
					class="space-x-2"
				>
					<Trash class="icon-xs" />
					<span>Delete</span>
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
