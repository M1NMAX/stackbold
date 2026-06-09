<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Menu from '@lucide/svelte/icons/menu';
	import type { Snippet } from 'svelte';
	import { tm } from '$lib/utils/index.js';
	import { Button } from '$lib/components/base/index.js';
	import { ANIMATION_DURATION, PAGE_ICONS } from '$lib/constant/index.js';
	import { fly } from 'svelte/transition';
	import { getSidebarState } from '$lib/components/sidebar/index.js';
	import { UserMenu } from '$lib/components/user/index.js';

	type Props = {
		icon?: string;
		title: string;
		children: Snippet;
		isBase?: boolean;
		sidebar?: boolean;
		breadcrumbs?: Snippet;
		actionsRow?: Snippet;
		topActions?: Snippet;
		footer?: Snippet;
		class?: string;
		contentClass?: string;
	};
	let {
		icon,
		title,
		children,
		isBase = false,
		sidebar = true,
		breadcrumbs,
		actionsRow,
		topActions,
		footer,
		class: className,
		contentClass
	}: Props = $props();

	let isSmHeadingVisible = $state(false);

	const sidebarState = getSidebarState();

	function onscroll(e: Event) {
		const targetEl = e.currentTarget as HTMLElement;
		isSmHeadingVisible = targetEl.scrollTop > 0;
	}
</script>

<svelte:head>
	<title>{title ? `${title} -` : ''} Stackbold</title>
</svelte:head>

<main
	class={tm(
		'grow h-full flex flex-col gap-y-1 rounded-md bg-card text-secondary-foreground overflow-hidden',
		className
	)}
>
	<header class="px-2 pt-2 md:px-4 md:pt-4">
		<div
			class={tm(
				'flex items-center justify-between gap-x-2',
				isSmHeadingVisible ? 'pb-1 border-b' : '',
				!sidebar && !isSmHeadingVisible && topActions != null ? 'justify-end' : ''
			)}
		>
			{#if sidebar}
				<Button
					theme="secondary"
					variant="icon"
					onclick={() => sidebarState.open()}
					class={tm(sidebarState.isOpen ? 'hidden' : 'hidden lg:flex')}
				>
					<Menu />
				</Button>
			{/if}

			{#if isBase}
				<UserMenu class="flex lg:hidden" />
			{:else}
				<Button
					theme="secondary"
					variant="icon"
					class="flex lg:hidden"
					onclick={() => history.back()}
				>
					<ChevronLeft />
				</Button>
			{/if}

			{#if isBase || isSmHeadingVisible}
				<h1
					transition:fly={{ y: -8, duration: ANIMATION_DURATION }}
					class={tm(
						'grow text-xl font-semibold',
						isBase && !isSmHeadingVisible ? 'block lg:hidden' : ''
					)}
				>
					{title}
				</h1>
			{:else if breadcrumbs}
				{@render breadcrumbs()}
			{/if}

			{@render topActions?.()}
		</div>

		{#if !isSmHeadingVisible}
			<div
				transition:fly={{ y: 8, duration: ANIMATION_DURATION }}
				class={tm('w-full flex items-center gap-x-2 pt-2 lg:pt-4', isBase && 'hidden lg:flex')}
			>
				{#if actionsRow}
					{@render actionsRow()}
				{:else}
					{#if icon}
						{@const Icon = PAGE_ICONS[icon.toLowerCase()]}
						<Icon class="shrink-0 size-6" />
					{/if}
					<h1 class="grow text-2xl font-semibold">{title}</h1>
				{/if}
			</div>
		{/if}
	</header>

	<div
		{onscroll}
		class={tm(
			'h-full w-full flex flex-col gap-y-2 mx-auto py-2 px-2 md:px-4 overflow-x-hidden overflow-y-auto hd-scroll',
			contentClass
		)}
	>
		{@render children()}
	</div>

	{@render footer?.()}
</main>
