<script lang="ts">
	import {
		DotsHorizontalOutline,
		EyeSlashOutline,
		FileCopyOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { Dropdown, DropdownDivider, DropdownItem, IconBtn } from '$lib/components';
	import { createEventDispatcher } from 'svelte';

	export let itemId: string;

	const dispatch = createEventDispatcher<{
		clickOpenItem: string;
		clickHideItem: string;
		clickDuplicateItem: string;
		clickDeleteItem: string;
	}>();
	// class="invisible group-hover:visible"
</script>

<Dropdown>
	<IconBtn slot="button">
		<DotsHorizontalOutline />
	</IconBtn>

	<svelte:fragment>
		<DropdownItem on:click={() => dispatch('clickHideItem', itemId)}>
			<EyeSlashOutline />
			<span> Hide item </span>
		</DropdownItem>

		<DropdownItem on:click={() => dispatch('clickDuplicateItem', itemId)}>
			<FileCopyOutline />
			<span> Duplicate </span>
		</DropdownItem>
		<DropdownDivider />
		<DropdownItem on:click={() => dispatch('clickDeleteItem', itemId)} class="dropdown-item-red">
			<TrashBinOutline />
			<span> Delete </span>
		</DropdownItem>
	</svelte:fragment>
</Dropdown>
