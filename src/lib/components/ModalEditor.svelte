<script lang="ts">
	import IconBtn from './IconBtn.svelte';
	import { CloseOutline } from 'flowbite-svelte-icons';
	import { createEventDispatcher } from 'svelte';

	type T = $$Generic;

	export let itemName: string;
	export let item: (T & { id: string | null; name?: string; createdAt?: Date }) | null;
	export let arrayFields: string[] | undefined = undefined;

	const dispatch = createEventDispatcher<{ cancel: undefined; save: T }>();
	const handleCancel = () => dispatch('cancel');

	const handleSave = (e: { currentTarget: HTMLFormElement }) => {
		const formData = new FormData(e.currentTarget);
		const data: Record<string, unknown> = {};

		if (arrayFields) {
			for (const key of arrayFields) {
				data[key] = [];
			}
		}

		for (let field of formData) {
			const [key, value] = field;
			if (arrayFields?.includes(key)) {
				(data[key] as unknown[]).push(value);
			} else {
				data[key] = value;
			}
		}
		dispatch('save', data as T);
	};
</script>

<dialog open={!!item} class="modal rounded">
	<div class="modal-box rounded p-2.5 space-y-2">
		<div class="flex justify-between">
			<h3 class="font-bold text-lg">Edit {itemName}</h3>
			<IconBtn on:click={handleCancel} class="btn btn-sm py-1 px-1.5">
				<CloseOutline size="sm" />
			</IconBtn>
		</div>
		<form on:submit|preventDefault={handleSave} class="space-y-1">
			<slot />
			<div class="flex justify-end space-x-2">
				<button class="btn btn-sm" on:click|preventDefault={handleCancel}>Cancel</button>
				<button class="btn btn-sm btn-primary">Save</button>
			</div>
		</form>
	</div>
</dialog>
