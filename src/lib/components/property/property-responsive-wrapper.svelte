<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getScreenSizeState } from '$lib/components/screen';

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

<div>FixME</div>
