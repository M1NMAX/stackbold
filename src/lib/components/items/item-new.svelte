<script lang="ts">
	import { getScreenState } from '$lib/components/screen';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		isOpen: boolean;
	};
	let { children, isOpen = $bindable(false) }: Props = $props();

	const isDesktop = getScreenState();
</script>

{#if $isDesktop}
	<Dialog.Root bind:open={isOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title class="text-center">New item</Dialog.Title>
			</Dialog.Header>
			{@render children()}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Sheet.Root bind:open={isOpen}>
		<Sheet.Content side="bottom">
			<Sheet.Header>
				<Sheet.Title class="text-center">New item</Sheet.Title>
			</Sheet.Header>
			{@render children()}
		</Sheet.Content>
	</Sheet.Root>
{/if}
