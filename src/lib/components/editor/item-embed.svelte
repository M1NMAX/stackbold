<script lang="ts">
	import { ViewType } from '@prisma/client';
	import { PropertyValue, getPropertyState } from '$lib/components/property/index.js';
	import { getItemState } from '$lib/components/item/index.js';
	import { getCollectionState } from '$lib/components/collection/index.js';
	import { tm } from '$lib/utils/index.js';
	import { DEBOUNCE_INTERVAL } from '$lib/constant/index.js';
	import { Checkbox } from '$lib/components/base/index.js';
	import debounce from 'debounce';
	import { tick } from 'svelte';

	const VIEW = {
		id: crypto.randomUUID(),
		name: 'document',
		type: ViewType.LIST,
		shortId: 0,
		order: 0,
		collectionId: '',
		properties: [],
		filters: [],
		sorts: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		groupBy: null,
		hideEmptyGroups: null,
		hideItemCounts: null
	};

	type Props = {
		id: string;
		onClickItem: (id: string) => void;
		onExit: (direction: 'up' | 'down' | 'left' | 'right') => void;
		onEnter: () => void;
		onDelete: () => void;
		autofocus?: boolean;
	};

	let {
		id,
		onClickItem,
		onExit,
		onEnter,
		onDelete,
		autofocus: autoFocus = false
	}: Props = $props();
	const collectionState = getCollectionState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const item = $derived(itemState.getItem(id));
	const isTaskModeEnabled = $derived(getIsTaskModeEnabled());

	let inputEl = $state<HTMLInputElement | null>(null);
	let isFocused = $state(false);
	let nameValue = $state('');
	let hasAutoFocused = false;

	const isDone = $derived(item?.isDone ?? false);
	const displayName = $derived(isFocused ? nameValue : (item?.name ?? ''));

	const updNameDebounce = debounce(async (name: string) => {
		await itemState.updItem({ id, name });
	}, DEBOUNCE_INTERVAL);

	async function handleNameInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		nameValue = value;
		await updNameDebounce(value);
	}

	async function toggleIsDone() {
		if (!item) return;
		await itemState.updItem({ id, isDone: !item.isDone });
	}

	function handleFocus() {
		nameValue = item?.name ?? '';
		isFocused = true;
	}

	function handleBlur() {
		updNameDebounce.flush();
		isFocused = false;
	}

	function stopClick(e: MouseEvent) {
		e.stopPropagation();
	}

	function getIsTaskModeEnabled() {
		if (!item) return false;

		const collection = collectionState.getCollection(item.collectionId);
		if (!collection) return false;

		return collection.isTaskModeEnabled;
	}

	function handleKeydown(e: KeyboardEvent) {
		const el = e.currentTarget as HTMLInputElement;
		const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
		const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length;

		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				onExit('up');
				break;
			case 'ArrowDown':
				e.preventDefault();
				onExit('down');
				break;
			case 'ArrowLeft':
				if (atStart) {
					e.preventDefault();
					onExit?.('left');
				}
				break;
			case 'ArrowRight':
				if (atEnd) {
					e.preventDefault();
					onExit('right');
				}
				break;
			case 'Enter':
				if (e.isComposing) break;
				e.preventDefault();
				if (el.value === '') {
					onExit('down');
					break;
				}
				onEnter();
				break;
			case 'Backspace':
				if (el.value === '') {
					e.preventDefault();
					updNameDebounce.clear();
					onDelete();
				}
				break;
		}
	}

	$effect(() => {
		itemState.requestItem(id);
	});

	$effect(() => {
		if (autoFocus && inputEl && !hasAutoFocused) {
			hasAutoFocused = true;
			tick().then(() => inputEl?.focus());
		}
	});
</script>

{#if item}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-active={item.id === itemState.active ? '' : undefined}
		aria-current={item.id === itemState.active ? 'true' : undefined}
		class="flex w-full cursor-pointer items-start gap-x-2 border-r-2 border-transparent p-1.5 transition-colors hover:bg-secondary/60 data-[active]:border-primary data-[active]:bg-secondary/80"
		onclick={() => onClickItem(item.id)}
	>
		{#if isTaskModeEnabled}
			<div class="flex h-6 shrink-0 items-center">
				<Checkbox checked={isDone} onchange={toggleIsDone} onclick={stopClick} size="lg" />
			</div>
		{/if}

		<div class="flex min-w-0 flex-1 flex-col gap-y-1">
			<input
				bind:this={inputEl}
				class={tm(
					'h-6 max-w-full min-w-[1ch] self-start bg-transparent outline-none',
					isTaskModeEnabled &&
						isDone &&
						'text-muted-foreground line-through decoration-primary decoration-2'
				)}
				style="field-sizing: content;"
				data-item-name-input
				value={displayName}
				oninput={handleNameInput}
				onfocus={handleFocus}
				onblur={handleBlur}
				onclick={stopClick}
				onkeydown={handleKeydown}
			/>

			<div class="flex flex-wrap items-end gap-2 select-none" onclick={stopClick}>
				{#each propertyState.properties as property (property.id)}
					<PropertyValue {item} {property} view={VIEW} />
				{/each}
			</div>
		</div>
	</div>
{:else}
	<div class="skeleton">loading...</div>
{/if}
