<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import {
		AdaptiveWrapper,
		buttonVariants,
		Label,
		MenuTitle,
		RadioGroup,
		RadioGroupItem
	} from './index.js';
	import { APP_ICONS, MAX_VISIBLE_VIEWS_TAB } from '$lib/constant/index.js';
	import { ModalState } from '$lib/states/index.js';
	import type { OnChangeFn } from '$lib/types.js';
	import { tm } from '$lib/utils/index.js';

	type Option = {
		id: string;
		label: string;
		icon?: string;
	};

	type Props = {
		title?: string;
		value: string;
		options: Option[];
		onchange?: OnChangeFn<string>;
	};

	let { title, value = $bindable(), options, onchange: onchangeFn }: Props = $props();

	const menuState = new ModalState();
	const showTabBtns = $derived(options.length <= MAX_VISIBLE_VIEWS_TAB);
	const selected = $derived.by(() => options.find((o) => o.id === value)!);

	function onchange(v: string) {
		value = v;
		onchangeFn?.(v);
		menuState.close();
	}
</script>

<RadioGroup
	{value}
	{onchange}
	class={tm('hidden h-9 gap-x-1.5', showTabBtns ? 'lg:flex' : 'lg:hidden')}
>
	{@render content(true)}
</RadioGroup>

<div class={tm('block', showTabBtns ? 'lg:hidden' : 'lg:block')}>
	<AdaptiveWrapper
		bind:open={menuState.isOpen}
		floatingAlign="start"
		triggerClass={buttonVariants({
			theme: 'outline',
			class: 'rounded-xl min-w-14'
		})}
	>
		{#snippet trigger()}
			{#if selected.icon}
				{@const Icon = APP_ICONS[selected.icon.toLowerCase()]}
				<Icon />
			{/if}
			<span class="max-w-20 md:max-w-28 text-nowrap text-ellipsis overflow-hidden">
				{selected.label}
			</span>

			<ChevronDown class={tm('size-3', menuState.isOpen ? 'rotate-180' : 'rotate-0')} />
		{/snippet}

		{#if title}
			<MenuTitle {title} />
		{/if}
		<RadioGroup {value} {onchange}>
			{@render content(false)}
		</RadioGroup>
	</AdaptiveWrapper>
</div>

{#snippet content(inline: boolean)}
	{#each options as opt}
		<Label
			for={opt.id}
			compact={!inline}
			hoverEffect
			class={tm(
				inline
					? 'min-w-14 justify-center py-1.5 px-2.5 !rounded-xl border-2 font-semibold max-w-xs'
					: '',
				inline && selected.id == opt.id ? 'bg-secondary text-secondary-foreground' : ''
			)}
		>
			{#if opt.icon}
				{@const Icon = APP_ICONS[opt.icon.toLowerCase()]}
				<Icon />
			{/if}
			<span class="text-nowrap text-ellipsis overflow-hidden">{opt.label} </span>
			<RadioGroupItem id={opt.id} value={opt.id} class={tm(inline && 'sr-only')}></RadioGroupItem>
		</Label>
	{/each}
{/snippet}
