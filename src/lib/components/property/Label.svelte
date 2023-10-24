<script lang="ts">
	import {
		DotsVerticalOutline,
		EditOutline,
		FileCopyOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import IconBtn from '../IconBtn.svelte';
	import Dropdown from '../Dropdown/Dropdown.svelte';
	import DropdownItem from '../Dropdown/DropdownItem.svelte';
	import DropdownDivider from '../Dropdown/DropdownDivider.svelte';

	export let id: string;
	export let name: string;
</script>

<label for={id} class="label grow font-semibold text-base">
	<span class="label-text"> {name}</span>

	<Dropdown>
		<IconBtn slot="button">
			<DotsVerticalOutline />
		</IconBtn>
		<svelte:fragment>
			<DropdownItem>
				<EditOutline />
				<span> Edit Property </span>
			</DropdownItem>

			<DropdownItem>
				<FileCopyOutline />
				<span> Duplicate Property </span>
			</DropdownItem>
			<DropdownDivider />
			<DropdownItem>
				<TrashBinOutline />
				<span> Delete Property</span>
			</DropdownItem>
		</svelte:fragment>
	</Dropdown>
</label>
