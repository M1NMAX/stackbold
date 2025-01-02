<script lang="ts">
	import { Check } from 'lucide-svelte';
	import { SearchInput } from '$lib/components/filters/index.js';
	import { ModalState } from '$lib/components/modal';
	import { INPUT_ICONS } from '$lib/constant';
	import { cn } from '$lib/utils';
	import { MediaQuery } from 'svelte/reactivity';
	import { Drawer, Toggler } from '.';

	type Lead = { type: 'color'; color: string } | { type: 'icon'; key: string };

	type Option = {
		lead?: Lead;
		id: string;
		label: string;
		isSelected: boolean;
		theme?: string;
	};

	type Props = {
		id: string;
		options: Option[];
		noOptionText?: string;
		placeholder?: string;
		searchable?: boolean;
		disabled?: boolean;
		onselect: (options: Option) => void;
	};

	//TODO: add support to multiple options
	let {
		id,
		options,
		noOptionText = 'No options found',
		placeholder = '-- Select --',
		searchable = false,
		disabled = false,
		onselect
	}: Props = $props();

	let selected = $derived.by(() => {
		return options.filter((option) => option.isSelected);
	});

	let menuState = new ModalState();

	const isLargeScreen = new MediaQuery('min-width: 768px', false);

	function toggle() {
		if (menuState.isOpen) menuState.close();
		else menuState.open();
	}

	function onLabelClick(e: Event) {
		e.preventDefault();
		if (!disabled) toggle();
	}

	function selectOption(e: MouseEvent, option: Option) {
		e.preventDefault();
		onselect(option);
		menuState.close();
	}

	$effect(() => {
		const labels = document.querySelectorAll(`label[for="${id}"]`);

		for (const label of labels) {
			label.addEventListener('click', (ev) => onLabelClick(ev));
		}

		return () => {
			for (const label of labels) {
				label.removeEventListener('click', (ev) => onLabelClick(ev));
			}
		};
	});

	//TODO: manager active option
</script>

<div class="relative block outline-none">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		tabindex={disabled ? -1 : 0}
		role="button"
		class={['select-container', menuState.isOpen && 'open']}
		onclick={toggle}
	>
		{#each selected as option}
			<span
				class={['h-6 py-1 px-1.5 flex items-center rounded-sm font-semibold text-sm', option.theme]}
			>
				{option.label}
			</span>
		{:else}
			<div>{placeholder}</div>
		{/each}
	</div>

	{#if !disabled}
		{#if isLargeScreen.current}
			<Toggler
				bind:open={menuState.isOpen}
				class="w-full absolute z-50 right-0 left-auto top-[100%] p-1 rounded bg-secondary"
			>
				<div>
					<!-- TODO: turn options searchable -->
					{#if searchable}
						<SearchInput placeholder="Search for an option..." />
					{/if}

					<div class="p-1 rounded-md shadow-md outline-none bg-popover text-popover-foreground">
						{#each options as option}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								tabindex="0"
								role="menuitem"
								class="w-full flex items-center gap-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
								onclick={(e) => selectOption(e, option)}
							>
								{#if option.lead}
									{@render lead(option.lead)}
								{/if}
								<span class="grow">
									{option.label}
								</span>

								<Check class={cn('icon-xs', !option.isSelected && 'text-transparent')} />
							</div>
						{:else}
							<div>
								{noOptionText}
							</div>
						{/each}
					</div>
				</div>
			</Toggler>
		{:else}
			<Drawer bind:open={menuState.isOpen}>
				<div class="p-1 rounded-md shadow-md outline-none">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					{#each options as option}
						<div
							tabindex="0"
							role="menuitem"
							class="w-full flex items-center gap-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
							onclick={(e) => selectOption(e, option)}
						>
							{#if option.lead}
								{@render lead(option.lead)}
							{/if}
							<span class="grow">
								{option.label}
							</span>

							<Check class={cn('icon-xs', !option.isSelected && 'text-transparent')} />
						</div>
					{:else}
						<div>
							{noOptionText}
						</div>
					{/each}
				</div>
			</Drawer>
		{/if}
	{/if}
</div>

{#snippet lead(args: Lead)}
	{#if args.type === 'color'}
		<span class={['size-3.5 rounded-sm', args.color]}> </span>
	{:else if args.type === 'icon'}
		{@const Icon = INPUT_ICONS[args.key]}
		<Icon class="icon-xs" />
	{/if}
{/snippet}

<style>
	.select-container {
		@apply w-full flex flex-wrap gap-x-1 px-2 pb-1.5 select-none relative;

		&::after {
			@apply absolute content-[""] top-[50%] right-2 h-0 w-0 border-4 border-t-gray-600 border-r-transparent border-b-transparent border-l-transparent;
		}

		&.open {
			&::after {
				@apply rotate-180;
			}
		}
	}
</style>
