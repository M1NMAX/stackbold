<script lang="ts">
	import {
		DotsHorizontalOutline,
		EditOutline,
		FileCopyOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import IconBtn from '../IconBtn.svelte';
	import Dropdown from '../Dropdown/Dropdown.svelte';
	import DropdownItem from '../Dropdown/DropdownItem.svelte';
	import DropdownDivider from '../Dropdown/DropdownDivider.svelte';
	import { createEventDispatcher } from 'svelte';

	export let id: string;
	export let name: string;

	const dispatch = createEventDispatcher<{ duplicate: string; edit: string; delete: string }>();
</script>

<label for={id} class="label grow font-semibold text-base">
	<span class="label-text"> {name}</span>

	<Dropdown>
		<IconBtn slot="button">
			<DotsHorizontalOutline size="sm" />
		</IconBtn>
		<svelte:fragment>
			<DropdownItem on:click={() => dispatch('edit', id)}>
				<EditOutline />
				<span> Edit Property </span>
			</DropdownItem>

			<DropdownItem on:click={() => dispatch('duplicate', id)}>
				<FileCopyOutline />
				<span> Duplicate Property </span>
			</DropdownItem>

			<DropdownDivider />

			<DropdownItem on:click={() => dispatch('delete', id)}>
				<TrashBinOutline />
				<span> Delete Property</span>
			</DropdownItem>
		</svelte:fragment>
	</Dropdown>
</label>
