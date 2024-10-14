<script lang="ts">
	import { cn } from '$lib/utils';
	import { getSidebarState } from '.';
	import { goto } from '$app/navigation';
	import { getScreenState } from '$lib/components/view';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		href?: string;
		active: boolean;
		label: string;
	};

	let { children, href, active = false, label, ...rest }: Props = $props();

	const sidebarState = getSidebarState();
	const isDesktop = getScreenState();

	function onClickSidebarItem(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		if (e.metaKey || e.ctrlKey || $isDesktop) return;

		const { href } = e.currentTarget;
		$sidebarState = false;
		goto(href);
	}
</script>

<a
	{href}
	onclick={onClickSidebarItem}
	{...rest}
	class={cn(
		'w-full flex items-center space-x-1.5 py-0.5 px-1.5  hover:bg-secondary/95 	transition duration-75 text-secondary-foreground',
		active && 'border-r-2 border-primary bg-secondary'
	)}
>
{@render children()}

	<span class={cn('font-semibold', active && 'text-primary')}>
		{label}
	</span>
</a>
