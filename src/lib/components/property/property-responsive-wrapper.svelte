<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getScreenState } from '$lib/components/view';
	import * as Popover from '$lib/components/ui/popover';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '../ui/button';

	type Props = {
		children: Snippet;
		header: Snippet;
		open: boolean;

		btnClass?: string;
		desktopClass?: string;
		mobileClass?: string;
	};

	let {
		children,
		open = $bindable(),
		header,
		btnClass,
		desktopClass,
		mobileClass
	}: Props = $props();

	const isDesktop = getScreenState();
</script>

{#if $isDesktop}
	<Popover.Root bind:open>
		<Popover.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class={btnClass}>
				{@render header()}
			</Button>
		</Popover.Trigger>

		<Popover.Content align="center" class={desktopClass}>
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
