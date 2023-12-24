<script lang="ts">
	import { MoreHorizontal, Pencil, Plus, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';

	import { createEventDispatcher } from 'svelte';

	export let id: string;
	export let name: string;

	let isPopoverOpen = false;
	let isNewCollection = false;

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
</script>

<div>
	<Popover.Root bind:open={isPopoverOpen}>
		<Popover.Trigger class="sr-only">Open</Popover.Trigger>
		<Popover.Content class="p-1">
			<form class="space-y-1">
				<div class="flex space-x-1.5">
					<label for="name" class=" sr-only"> Name </label>
					{#if isNewCollection}
						<input
							id="name"
							name="name"
							placeholder="Tasks, ToDo ..."
							class="grow input input-ghost px-1 font-semibold text-sm"
							on:keydown={handleKeydown}
						/>
					{:else}
						<input
							id="name"
							value={name}
							name="name"
							class="grow input input-ghost px-1 font-semibold text-sm"
							on:keydown={handleKeydown}
						/>
					{/if}
				</div>
			</form>
		</Popover.Content>
	</Popover.Root>

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

			<DropdownMenu.Item
				on:click={() => {
					isPopoverOpen = true;
					isNewCollection = false;
				}}
				class="space-x-2"
			>
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
</div>
