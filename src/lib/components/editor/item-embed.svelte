<script module lang="ts">
	import { ViewType } from '@prisma/client';
	import { PropertyValue, getPropertyState } from '$lib/components/property/index.js';
	import { getItemState } from '../item';
	import { tm } from '$lib/utils/index.js';
	import debounce from 'debounce';
	import { DEBOUNCE_INTERVAL } from '$lib/constant';
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
</script>

<script lang="ts">
	type Props = {
		id: string;
		onClickItem: (id: string) => void;
		autofocus?: boolean;
	};

	let { id, onClickItem, autofocus = false }: Props = $props();
	const itemState = getItemState();
	const propertyState = getPropertyState();
	const item = $derived(itemState.getItem(id));

	let nameValue = $state('');
	let hasInitialized = false;
	let inputEl = $state<HTMLInputElement | null>(null);

	const updNameDebounce = debounce(async (name: string) => {
		await itemState.updItem({ id, name });
	}, DEBOUNCE_INTERVAL);

	async function handleNameInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		nameValue = value;
		await updNameDebounce(value);
	}

	function stopClick(e: MouseEvent) {
		e.stopPropagation();
	}

	$effect(() => {
		itemState.requestItem(id);
	});

	$effect(() => {
		if (item && !hasInitialized) {
			nameValue = item.name;
			hasInitialized = true;

			if (autofocus) {
				tick().then(() => {
					inputEl?.focus();
				});
			}
		}
	});
</script>

{#if item}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={tm(
			'w-full flex flex-col items-start gap-y-1 p-1.5 my-2 hover:bg-secondary/60 cursor-pointer',
			item.id === itemState.active && 'border-r-2 border-primary bg-secondary/80'
		)}
		onclick={() => onClickItem(id)}
	>
		<div class="w-full flex justify-between items-center">
			<input
				bind:this={inputEl}
				class="bg-transparent outline-none"
				style="field-sizing: content;"
				value={nameValue}
				oninput={handleNameInput}
				onclick={stopClick}
			/>
		</div>
		<div class="flex items-end flex-wrap gap-2 select-none" onclick={stopClick}>
			{#each propertyState.properties as property (property.id)}
				<PropertyValue {item} {property} view={VIEW} />
			{/each}
		</div>
	</div>
{:else}
	<div class="skeleton">loading...</div>
{/if}
