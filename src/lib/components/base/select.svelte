<script lang="ts" generics="IsMulti extends boolean = false">
	import Check from 'lucide-svelte/icons/check';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import { APP_ICONS, THEME_COLORS, SCREEN_LG_MEDIA_QUERY } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		Badge,
		Button,
		buttonVariants,
		Drawer,
		Floating,
		HSeparator,
		MenuTitle
	} from './index.js';
	import { tick } from 'svelte';
	import type { SelectOption } from '$lib/types';
	import { Color } from '@prisma/client';
	import { ChevronDown } from 'lucide-svelte';

	type SingleSelect = (option: SelectOption) => void;
	type MultiSelect = (option: SelectOption[]) => void;

	type Props = {
		id: string;
		options: SelectOption[];
		noOptionText?: string;
		placeholder?: string;
		searchable?: boolean;
		disabled?: boolean;
		smTitle?: string;
		arrow?: boolean;
		triggerClass?: string;
		isMulti?: IsMulti;
		onselect: IsMulti extends true ? MultiSelect : SingleSelect;
	};

	let {
		id,
		options,
		noOptionText = 'No options found',
		placeholder = '-- Select --',
		searchable = false,
		disabled = false,
		smTitle,
		arrow = true,
		triggerClass,
		isMulti = false as IsMulti,
		onselect
	}: Props = $props();

	let highlighted = $state('');
	let selectedOptions = $derived.by(() => {
		return options.filter((opt) => opt.isSelected);
	});
	let selectedToRender = $derived.by(() => {
		if (selectedOptions.length <= 2) return selectedOptions;
		if (selectedOptions.length === 3) return selectedOptions.slice(0, 3);

		return [
			...selectedOptions.slice(0, 3),
			{
				id: 'selector-more-option-id',
				label: `+${selectedOptions.length - 3} More`,
				isSelected: false,
				theme: THEME_COLORS[Color.GRAY]
			}
		];
	});

	let search = $state('');
	let filteredOptions = $derived.by(() => {
		const searchTerm = search.replace(/\s+/g, '').toLowerCase();

		return options.filter((option) =>
			option.label.replace(/\s+/g, '').toLowerCase().includes(searchTerm)
		);
	});

	const { triggerId, searchInputId, contentId } = $derived({
		triggerId: `select-trigger-${id}`,
		searchInputId: `select-search-${id}`,
		contentId: `select-content-${id}`
	});

	const menuState = new ModalState();
	const isLargeScreen = new MediaQuery(SCREEN_LG_MEDIA_QUERY, false);

	function resetSearch() {
		search = '';
		tick().then(() => {
			const inputEl = document.getElementById(searchInputId) as HTMLInputElement;
			inputEl.focus();
		});
	}

	const clearOption: SelectOption = {
		id: '',
		label: '',
		isSelected: false
	};

	function isSelected(id: string) {
		if (id === 'more-selected-options-id') return false;
		const opt = selectedOptions.find((option) => option.id === id);
		return !!opt;
	}

	function selectOption(option: SelectOption) {
		if (isMulti) {
			(onselect as MultiSelect)(toggleOption(option));
		} else {
			(onselect as SingleSelect)(isSelected(option.id) ? clearOption : option);
			menuState.close();
			search = '';
		}
	}
	function toggleOption(option: SelectOption) {
		if (!isSelected(option.id)) return [...selectedOptions, option];
		return selectedOptions.filter((opt) => opt.id !== option.id);
	}

	function handleKeydown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'j')) {
			e.preventDefault();
			highlightNext();
		} else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'k')) {
			e.preventDefault();
			e.stopPropagation();
			highlighPrev();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const opt = filteredOptions.find((opt) => opt.id === highlighted);
			if (!opt) return;
			selectOption(opt);
		}
	}

	function highlightOption(id: string) {
		highlighted = id;

		tick().then(() => {
			if (highlighted) {
				const el = document.getElementById(highlighted) as HTMLElement;
				el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			}
		});
	}

	function highlightFirstOption() {
		if (filteredOptions.length > 0) {
			highlightOption(filteredOptions[0].id);
		}
	}

	function highlightLastOption() {
		if (filteredOptions.length > 0) {
			highlightOption(filteredOptions[filteredOptions.length - 1].id);
		}
	}

	function highlightNext() {
		const currentIdx = filteredOptions.findIndex((opt) => opt.id === highlighted);
		if (currentIdx === -1 || currentIdx + 1 >= filteredOptions.length) {
			highlightFirstOption();
			return;
		}
		highlightOption(filteredOptions[currentIdx + 1].id);
	}

	function highlighPrev() {
		const currentIdx = filteredOptions.findIndex((opt) => opt.id === highlighted);
		if (currentIdx === -1 || currentIdx - 1 < 0) {
			highlightLastOption();
			return;
		}
		highlightOption(filteredOptions[currentIdx - 1].id);
	}

	function onLabelClick(e: Event) {
		e.preventDefault();
		if (!disabled) menuState.toggle();
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

	$effect(() => {
		function getElement() {
			if (searchable) {
				return document.getElementById(searchInputId) as HTMLElement;
			}
			return document.getElementById(contentId) as HTMLElement;
		}

		if (menuState.isOpen && isLargeScreen.current) {
			const el = getElement();
			tick().then(() => {
				el.focus();
				highlightFirstOption();
			});
		}
	});

	$effect(() => {
		if (search) {
			tick().then(() => highlightFirstOption());
		}
	});
</script>

<button
	id={triggerId}
	type="button"
	onclick={() => menuState.toggle()}
	class={tm(
		buttonVariants({
			theme: 'secondary',
			variant: 'menu',
			className: tm(triggerClass, 'bg-transparent hover:bg-transparent overflow-y-hidden relative')
		})
	)}
>
	{#each selectedToRender as opt}
		{@render option(opt)}
	{:else}
		<div class="px-1.5 text-sm font-semibold text-secondary-foreground">
			{placeholder}
		</div>
	{/each}

	{#if arrow}
		<ChevronDown
			class={tm(
				'size-3 absolute right-2 bottom-2 transition-transform',
				menuState.isOpen ? 'rotate-180' : 'rotate-0'
			)}
		/>
	{/if}
</button>

{#if !disabled}
	{#if isLargeScreen.current}
		<Floating triggerBy={triggerId} bind:visible={menuState.isOpen} sameWidth align="start">
			{@render searchInput()}
			{@render content()}
		</Floating>
	{:else}
		<Drawer bind:open={menuState.isOpen}>
			{#if smTitle}
				<MenuTitle title={smTitle} />
			{/if}

			{@render searchInput()}
			{@render content()}
		</Drawer>
	{/if}
{/if}

{#snippet searchInput()}
	{#if searchable}
		<div class="relative">
			<div class="input-left-icon">
				<Search />
			</div>
			<input
				id={searchInputId}
				class="input input-ghost icon-left icon-right"
				placeholder="Search for an option"
				bind:value={search}
				type="text"
				role="combobox"
				aria-controls={contentId}
				aria-expanded="true"
				aria-autocomplete="list"
				autocomplete="off"
				autocorrect="off"
				onkeydown={handleKeydown}
			/>

			{#if search && search.length > 0}
				<Button
					type="button"
					theme="ghost"
					variant="cicon"
					class="absolute inset-y-0 right-0"
					onclick={resetSearch}
				>
					<X />
				</Button>
			{/if}
		</div>
		<HSeparator />
	{/if}
{/snippet}

{#snippet content()}
	{#if filteredOptions.length > 0}
		<div
			id={contentId}
			role="listbox"
			aria-activedescendant={highlighted ?? undefined}
			tabindex="-1"
			onkeydown={handleKeydown}
			class="space-y-0.5"
		>
			{#each filteredOptions as option}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<div
					id={option.id}
					role="option"
					tabindex="-1"
					aria-selected={option.isSelected}
					class={tm(
						'h-9 lg:h-7 w-full flex items-center gap-x-1.5 py-1 lg:py-1.5 px-2 lg:px-0.5 rounded-none lg:rounded-md cursor-pointer',
						highlighted == option.id && 'bg-secondary text-secondary-foreground'
					)}
					onclick={() => selectOption(option)}
					onmouseover={() => highlightOption(option.id)}
				>
					{#if option.icon}
						{@render icon(option.icon)}
						<span class="grow text-sm font-semibold">
							{option.label}
						</span>
					{:else if option.theme}
						<span class="grow">
							<Badge class={tm(option.theme, 'w-fit h-6 lg:h-5 ')}>{option.label}</Badge>
						</span>
					{/if}

					<Check class={tm('size-4', !option.isSelected && 'text-transparent')} />
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-2">
			{noOptionText}
		</div>
	{/if}
{/snippet}

{#snippet icon(key: string)}
	{@const Icon = APP_ICONS[key.toLowerCase()]}
	<Icon class="size-4" />
{/snippet}

{#snippet option(opt: SelectOption)}
	<Badge class={opt.theme ?? 'bg-transparent dark:bg-transparent'}>
		{#if opt.icon}
			{@render icon(opt.icon)}
		{/if}
		<span>
			{opt.label}
		</span>
	</Badge>
{/snippet}
