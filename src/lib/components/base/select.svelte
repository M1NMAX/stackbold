<script lang="ts" module>
	export type Lead = { type: 'color'; color: string } | { type: 'icon'; key: string };
	export type Option = {
		lead?: Lead;
		id: string;
		label: string;
		isSelected: boolean;
		theme?: string;
	};
</script>

<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import Search from 'lucide-svelte/icons/search';
	import SquareX from 'lucide-svelte/icons/square-x';
	import { ModalState } from '$lib/states/index.js';
	import { INPUT_ICONS } from '$lib/constant/index.js';
	import { cn } from '$lib/utils';
	import { MediaQuery } from 'svelte/reactivity';
	import { Drawer, Dropdown } from './index.js';

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

	let search = $state('');
	let filteredOptions = $derived.by(() => {
		const searchTerm = search.replace(/\s+/g, '').toLowerCase();

		return options.filter((option) =>
			option.label.replace(/\s+/g, '').toLowerCase().includes(searchTerm)
		);
	});

	let menuState = new ModalState();

	const isLargeScreen = new MediaQuery('min-width: 768px', false);

	function onLabelClick(e: Event) {
		e.preventDefault();
		if (!disabled) menuState.toggle();
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

	function resetSearch() {
		search = '';
	}
</script>

<div class="relative block outline-none">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		tabindex={disabled ? -1 : 0}
		role="button"
		class={['select-container', menuState.isOpen && 'open']}
		onclick={() => menuState.toggle()}
	>
		{#each selected as option}
			<span
				class={[
					'h-6 flex items-center gap-x-1.5 py-1 px-1.5 rounded-sm font-semibold text-sm',
					option.theme
				]}
			>
				{#if option.lead && option.lead.type === 'icon'}
					{@render optionLead(option.lead)}
				{/if}
				<span>
					{option.label}
				</span>
			</span>
		{:else}
			<div class="h-5 px-1.5 pb-1 text-sm font-semibold text-gray-400 dark:text-gray-500">
				{placeholder}
			</div>
		{/each}
	</div>

	{#if !disabled}
		{#if isLargeScreen.current}
			<Dropdown
				bind:open={menuState.isOpen}
				class="w-full absolute z-50 right-0 left-auto top-[100%] p-1 rounded bg-secondary"
			>
				<div>
					{#if searchable}
						<div class="relative w-full mb-0.5">
							<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
								<Search class="size-4" />
							</div>
							<input
								class="w-full h-9 px-10 text-base font-semibold rounded-sm bg-popover focus:outline-none"
								placeholder="Search for an option"
								bind:value={search}
							/>

							{#if search && search.length > 0}
								<div class="absolute inset-y-0 right-0 pr-2 flex items-center">
									<button class="[&_svg]:size-6" onclick={resetSearch}>
										<SquareX />
									</button>
								</div>
							{/if}
						</div>
					{/if}

					<div class="p-1 rounded-md shadow-md outline-none bg-popover text-popover-foreground">
						{#each filteredOptions as option}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								tabindex="0"
								role="menuitem"
								class="w-full flex items-center gap-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
								onclick={(e) => selectOption(e, option)}
							>
								{#if option.lead}
									{@render optionLead(option.lead)}
								{/if}
								<span class="grow text-sm font-semibold">
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
			</Dropdown>
		{:else}
			<Drawer bind:open={menuState.isOpen}>
				<div class="p-1 rounded-md shadow-md outline-none">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					{#each filteredOptions as option}
						<div
							tabindex="0"
							role="menuitem"
							class="w-full flex items-center gap-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
							onclick={(e) => selectOption(e, option)}
						>
							{#if option.lead}
								{@render optionLead(option.lead)}
							{/if}
							<span class="grow text-sm font-semibold">
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

{#snippet optionLead(args: Lead)}
	{#if args.type === 'color'}
		<span class={['size-3.5 rounded-sm', args.color]}> </span>
	{:else if args.type === 'icon'}
		{@const Icon = INPUT_ICONS[args.key.toLowerCase()]}
		<Icon class="icon-xs" />
	{/if}
{/snippet}

<style>
	.select-container {
		@apply w-full flex flex-wrap gap-x-1 px-1.5 pb-1 select-none relative;

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
