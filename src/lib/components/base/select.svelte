<script lang="ts" generics="IsMulti extends boolean = false">
	import Check from 'lucide-svelte/icons/check';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import { ModalState } from '$lib/states/index.js';
	import { APP_ICONS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { buttonVariants, Drawer, Floating } from './index.js';
	import { tick } from 'svelte';
	import type { SelectOption } from '$lib/types';

	type SingleSelect = (option: SelectOption) => void;
	type MultiSelect = (option: SelectOption[]) => void;

	type Props<T extends boolean = false> = {
		id: string;
		options: SelectOption[];
		noOptionText?: string;
		placeholder?: string;
		searchable?: boolean;
		disabled?: boolean;
		triggerClass?: string;
		isMulti?: T;
		onselect: T extends true ? MultiSelect : SingleSelect;
	};

	let {
		id,
		options,
		noOptionText = 'No options found',
		placeholder = '-- Select --',
		searchable = false,
		disabled = false,
		triggerClass,
		isMulti = false as IsMulti,
		onselect
	}: Props<IsMulti> = $props();

	let highlighted = $state('');
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

	const triggerId = `select-trigger-${id}`;
	const searchInputId = `select-search-${id}`;
	const contentId = `select-content-${id}`;
	const menuState = new ModalState();
	const isLargeScreen = new MediaQuery('min-width: 768px', false);

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
		const opt = selected.find((option) => option.id === id);
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
		if (!isSelected(option.id)) return [...selected, option];
		return selected.filter((opt) => opt.id !== option.id);
	}

	function handleKeydown(e: KeyboardEvent) {
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
			className: tm('bg-transparent', triggerClass)
		})
	)}
>
	{#each selected as option}
		<span
			class={tm(
				'h-6 flex items-center gap-x-1.5 px-1.5 rounded-sm font-semibold text-sm',
				option.theme
			)}
		>
			{#if option.icon}
				{@render icon(option.icon)}
			{/if}
			<span>
				{option.label}
			</span>
		</span>
	{:else}
		<div class="px-1.5 text-sm font-semibold text-secondary-foreground">
			{placeholder}
		</div>
	{/each}
</button>

{#if !disabled}
	{#if isLargeScreen.current}
		<Floating
			triggerBy={triggerId}
			bind:visible={menuState.isOpen}
			sameWidth
			align="start"
			class="bg-secondary focus-within:bg-secondary/80"
		>
			{@render searchInput()}
			<div
				class="p-1 rounded-md shadow-md outline-none bg-popover text-popover-foreground max-h-60 overflow-y-auto"
			>
				{@render content()}
			</div>
		</Floating>
	{:else}
		<Drawer bind:open={menuState.isOpen}>
			{@render content()}
		</Drawer>
	{/if}
{/if}

{#snippet searchInput()}
	{#if searchable}
		<div class="relative mb-0.5">
			<div class="absolute inset-y-0 pl-2 flex items-center pointer-events-none">
				<Search class="size-4" />
			</div>
			<input
				id={searchInputId}
				class="w-full h-9 px-8 text-base font-semibold rounded-sm bg-popover focus:outline-none"
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
				<div class="absolute inset-y-0 right-0 pr-2 flex items-center">
					<button class="[&_svg]:size-4" onclick={resetSearch}>
						<X />
					</button>
				</div>
			{/if}
		</div>
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
						'w-full flex items-center gap-x-1.5 py-1.5 px-2 rounded-sm cursor-pointer',
						highlighted == option.id && 'bg-secondary text-secondary-foreground'
					)}
					onclick={() => selectOption(option)}
					onmouseover={() => highlightOption(option.id)}
				>
					{#if option.icon}
						{@render icon(option.icon)}
					{:else if option.theme}
						{@render color(option.theme)}
					{/if}
					<span class="grow text-sm font-semibold">
						{option.label}
					</span>

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

{#snippet color(theme: string)}
	<span class={['size-3.5 rounded-sm', theme]}> </span>
{/snippet}
