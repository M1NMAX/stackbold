<script lang="ts">
	import { CloseOutline } from 'flowbite-svelte-icons';

	export let open: boolean = false;
	export let title: string;
	export let onClose: () => void;
</script>

<dialog {open} class="modal rounded">
	<div class="modal-box rounded p-2.5 space-y-2">
		<div class="flex justify-between">
			<h3 class="font-bold text-lg">{title}</h3>

			<button on:click={onClose} class="btn btn-sm py-0.5 px-1.5">
				<CloseOutline size="sm" />
			</button>
		</div>
		<slot />
	</div>
</dialog>
