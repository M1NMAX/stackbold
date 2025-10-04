<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tm } from '$lib/utils';
	import { getSidebarState } from '.';
	import { goto } from '$app/navigation';
	import { MediaQuery } from 'svelte/reactivity';
	import { PAGE_ICONS, SCREEN_LG_MEDIA_QUERY } from '$lib/constant/index.js';
	type Props = {
		icon: string;
		label: string;
		active: boolean;
		href?: string;
	};

	let { icon, label, href, active = false, ...rest }: Props = $props();

	const Icon = $derived(PAGE_ICONS[icon]);
	const sidebarState = getSidebarState();
	const isLargeScreen = new MediaQuery(SCREEN_LG_MEDIA_QUERY, false);

	function onClickSidebarItem(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		if (e.metaKey || e.ctrlKey || isLargeScreen.current) return;

		const { href } = e.currentTarget;
		sidebarState.close();
		goto(href);
	}
</script>

<a
	{href}
	onclick={onClickSidebarItem}
	{...rest}
	class={tm(
		'w-full flex items-center space-x-1.5 py-0.5 px-2.5 [&>svg]:size-5 hover:bg-secondary/95 transition duration-75 text-secondary-foreground',
		active && 'border-r-2 border-primary bg-secondary text-primary'
	)}
>
	<Icon />

	<span class="font-semibold">
		{label}
	</span>
</a>
