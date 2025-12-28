<script lang="ts">
	import type { View } from '@prisma/client';
	import { tm } from '$lib/utils/index.js';
	import {
		AdaptiveWrapper,
		buttonVariants,
		Label,
		MenuTitle,
		RadioGroup,
		RadioGroupItem
	} from '$lib/components/base/index.js';
	import { MAX_VISIBLE_VIEWS_TAB, SCREEN_LG_MEDIA_QUERY, VIEW_ICONS } from '$lib/constant/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { MediaQuery } from 'svelte/reactivity';

	type Props = {
		views: View[];
		value: string;
		onchange: (v: string) => void;
	};

	let { views, value, onchange }: Props = $props();
	const view = $derived.by(() => views.find((v) => v.shortId.toString() === value)!);
	const CurrentIcon = $derived(VIEW_ICONS[view.type.toLowerCase()]);
	const menuState = new ModalState();
	const isLargeScreen = new MediaQuery(SCREEN_LG_MEDIA_QUERY, false);
</script>

{#if views.length > MAX_VISIBLE_VIEWS_TAB || !isLargeScreen.current}
	<AdaptiveWrapper
		bind:open={menuState.isOpen}
		triggerClass={buttonVariants({ theme: 'secondary' })}
		floatingAlign="start"
	>
		{#snippet trigger()}
			<CurrentIcon />
			<span class="max-w-20 md:max-w-28 font-semibold text-nowrap text-ellipsis overflow-hidden">
				{view.name}
			</span>
		{/snippet}

		<MenuTitle title="Views" />
		<RadioGroup
			{value}
			onchange={(v) => {
				menuState.close();
				onchange(v);
			}}
		>
			{#each views as view}
				{@const Icon = VIEW_ICONS[view.type.toLowerCase()]}
				<Label for={view.id} compact hoverEffect>
					<Icon />
					<span class="grow text-nowrap text-ellipsis overflow-hidden">{view.name} </span>
					<RadioGroupItem id={view.id} value={view.shortId.toString()}></RadioGroupItem>
				</Label>
			{/each}
		</RadioGroup>
	</AdaptiveWrapper>
{:else}
	<RadioGroup {value} {onchange} class="h-9 flex gap-0.5 rounded-md bg-secondary/50">
		{#each views as view}
			{@const Icon = VIEW_ICONS[view.type.toLowerCase()]}

			<Label
				for={`view-${view.id}`}
				class={tm(
					'flex items-center justify-center py-1.5 px-2 rounded-t-md text-ellipsis text-secondary-foreground cursor-pointer',
					+value === view.shortId && 'bg-secondary shadow-sm border-b-2 border-primary'
				)}
			>
				<RadioGroupItem value={view.shortId.toString()} id={`view-${view.id}`} class="sr-only" />
				<Icon />
				<span class="grow max-w-28 font-semibold text-nowrap text-ellipsis overflow-hidden">
					{view.name}
				</span>
			</Label>
		{/each}
	</RadioGroup>
{/if}
