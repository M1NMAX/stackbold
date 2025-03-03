<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getScreenSizeState } from '$lib/components/screen';
	import * as Popover from '$lib/components/ui/popover';
	import * as Drawer from '$lib/components/ui/drawer';
	import { buttonVariants } from '$lib/components/ui/button';

	type Props = {
		children: Snippet;
		header: Snippet;
		open: boolean;

		btnClass?: string;
		mobileClass?: string;

		// popover props
		desktopClass?: string;
		alignCenter?: boolean;
		onOpenChange?: (open: boolean) => void;
	};

	let {
		children,
		open = $bindable(),
		header,
		btnClass,
		mobileClass,

		// popover props
		desktopClass,
		alignCenter = true,
		onOpenChange
	}: Props = $props();

	const isLargeScreen = getScreenSizeState();
</script>

{#if isLargeScreen.current}
	<Popover.Root bind:open {onOpenChange}>
		<Popover.Trigger class={buttonVariants({ variant: 'ghost', className: btnClass })}>
			{@render header()}
		</Popover.Trigger>

		<Popover.Content align={alignCenter ? 'center' : 'start'} class={desktopClass}>
			{@render children()}
		</Popover.Content>
	</Popover.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger class={buttonVariants({ variant: 'ghost', className: btnClass })}>
			{@render header()}
		</Drawer.Trigger>

		<Drawer.Content class={mobileClass}>
			{@render children()}
		</Drawer.Content>
	</Drawer.Root>
{/if}
