<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getScreenState } from '$lib/components/view';
	import * as Popover from '$lib/components/ui/popover';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		children: Snippet;
		header: Snippet;
		open: boolean;

		btnClass?: string;
		mobileClass?: string;

		// popover props
		desktopClass?: string;
		portal?: boolean;
		alignCenter?: boolean;
		sameWidth?: boolean;
	};

	let {
		children,
		open = $bindable(),
		header,
		btnClass,
		mobileClass,

		// popover props
		desktopClass,
		portal = false,
		alignCenter = true,
		sameWidth = false
	}: Props = $props();

	const isDesktop = getScreenState();
</script>

{#if $isDesktop}
	<Popover.Root bind:open portal={portal ? 'HTMLElement' : undefined}>
		<Popover.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class={btnClass}>
				{@render header()}
			</Button>
		</Popover.Trigger>

		<Popover.Content align={alignCenter ? 'center' : 'start'} {sameWidth} class={desktopClass}>
			{@render children()}
		</Popover.Content>
	</Popover.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class={btnClass}>
				{@render header()}
			</Button>
		</Drawer.Trigger>

		<Drawer.Content class={mobileClass}>
			{@render children()}
		</Drawer.Content>
	</Drawer.Root>
{/if}
