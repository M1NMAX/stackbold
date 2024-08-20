<script lang="ts">
	import { getScreenState } from '$lib/components/view';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';

	export let isOpen = false;
	const isDesktop = getScreenState();
</script>

{#if $isDesktop}
	<Dialog.Root bind:open={isOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title class="text-center">New item</Dialog.Title>
			</Dialog.Header>

			<slot />
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Sheet.Root bind:open={isOpen}>
		<Sheet.Content side="bottom">
			<Sheet.Header>
				<Sheet.Title class="text-center">New item</Sheet.Title>
			</Sheet.Header>

			<slot />
		</Sheet.Content>
	</Sheet.Root>
{/if}
