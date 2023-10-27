<script lang="ts">
	import IconBtn from './IconBtn.svelte';
	import { CloseOutline } from 'flowbite-svelte-icons';
	import { createEventDispatcher } from 'svelte';

	type T = $$Generic;

	export let itemName: string;
	export let item: (T & { id: string | null; name?: string; createdAt?: Date }) | null;

	const dispatch = createEventDispatcher<{ cancel: undefined; save: T }>();
	const handleCancel = () => dispatch('cancel');
</script>

<dialog open={!!item} id="my_modal_1" class="modal rounded">
	<div class="modal-box rounded p-2.5">
		<div class="flex justify-between">
			<h3 class="font-bold text-lg">Edit {itemName}</h3>
			<IconBtn on:click={handleCancel} class="btn btn-sm py-1 px-1.5">
				<CloseOutline size="sm" />
			</IconBtn>
		</div>
		<form>
			<slot />
			<div class="flex justify-end space-x-2">
				<button class="btn btn-sm" on:click|preventDefault={handleCancel}>Cancel</button>
				<button class="btn btn-sm btn-primary">Save</button>
			</div>
		</form>
	</div>
</dialog>
