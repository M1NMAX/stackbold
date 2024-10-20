<script lang="ts">
	import { ItemMenu, getActiveItemState, getItemState } from '.';
	import {
		PropertyValue,
		containsView,
		// helpers
		getPropertyRef,
		getPropertyState
	} from '$lib/components/property';
	import { type Item, View } from '@prisma/client';
	import { cn, preventEnterKeypress } from '$lib/utils';
	import { getScreenState } from '$lib/components/view';
	import type { RouterInputs } from '$lib/trpc/router';
	import { DEBOUNCE_INTERVAL } from '$lib/constant';
	import debounce from 'debounce';

	type Props = {
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { items, clickOpenItem }: Props = $props();

	const isDesktop = getScreenState();
	const activeItem = getActiveItemState();
	const propertyState = getPropertyState();
	const itemState = getItemState();

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);
	async function updItem(args: RouterInputs['items']['update']) {
		itemState.updItem(args);
	}

	//TODO: validate inner text
	function handleOnInput(e: { currentTarget: EventTarget & HTMLDivElement }) {
		const targetEl = e.currentTarget;

		const id = targetEl.dataset.id!;
		const name = targetEl.innerText;
		updItemDebounced({ id, data: { name } });
	}

	function onClickItemBody(
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLDivElement;
		},
		itemId: string
	) {
		if (e.target === e.currentTarget) {
			clickOpenItem(itemId);
		}
	}
</script>

<div class="h-full space-y-2 grow overflow-y-auto">
	{#each items as item}
		<div
			tabindex="0"
			role="button"
			onclick={(e) => onClickItemBody(e, item.id)}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					clickOpenItem(item.id);
				}
			}}
			class={cn(
				'relative flex flex-col items-start py-1 px-2 space-y-2 overflow-hidden rounded-sm  bg-secondary/40 hover:bg-secondary/50 group ',
				item.id === activeItem.id && 'rounded-r-none border-r-2 border-primary bg-secondary/80'
			)}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				contenteditable
				spellcheck={false}
				onkeypress={preventEnterKeypress}
				oninput={handleOnInput}
				data-id={item.id}
				class="text-base font-semibold focus:outline-none cursor-text"
			>
				{item.name}
			</div>

			<ItemMenu
				id={item.id}
				name={item.name}
				{clickOpenItem}
				class={cn('absolute right-2 top-0', $isDesktop && 'invisible group-hover:visible')}
			/>

			<div class="flex flex-wrap gap-2">
				{#each propertyState.properties as property (property.id)}
					{#if containsView(property.visibleInViews, View.LIST)}
						{@const propertyRef = getPropertyRef(item.properties, property.id)}
						{#if propertyRef}
							<PropertyValue itemId={item.id} {property} />
						{/if}
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
