<script lang="ts">
	import { CloseOutline } from 'flowbite-svelte-icons';

	export let open: boolean = false;
	export let title: string | null = null;
	export let onClose: () => void;
</script>

<dialog {open} class="modal rounded bg-gray-500/40">
	<div class="modal-box rounded p-2.5 space-y-2 max-w-md">
		<div class={`flex ${title ? 'justify-between' : 'justify-end'}  `}>
			{#if title}
				<h3 class="font-bold text-lg">{title}</h3>
			{/if}

			<button on:click={onClose} class="btn btn-sm py-0.5 px-1.5">
				<CloseOutline size="sm" />
			</button>
		</div>
		<slot />
	</div>
</dialog>
