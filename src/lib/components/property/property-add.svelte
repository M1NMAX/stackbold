<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import { getPropertyState, PropertyIcon } from './index.js';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		MenuTitle
	} from '$lib/components/base/index.js';
	import { capitalizeFirstLetter } from '$lib/utils/index.js';
	import { PropertyType } from '@prisma/client';
	import { ModalState } from '$lib/states/index.js';
	import { getItemState } from '$lib/components/items/index.js';
	import { getViewState } from '$lib/components/view/index.js';

	type Props = {
		refresh: boolean;
	};

	let { refresh }: Props = $props();

	const wrapper = new ModalState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const viewState = getViewState();

	async function addProperty(propType: PropertyType) {
		wrapper.close();
		await propertyState.addProperty(propType);
		if (refresh) {
			await Promise.all([viewState.refresh(), itemState.refresh(viewState.viewShortId)]);
		}
	}
</script>

<AdaptiveWrapper
	bind:open={wrapper.isOpen}
	triggerClass={buttonVariants({ className: 'w-full' })}
	floatingAlign="start"
	sameWidth
>
	{#snippet trigger()}
		<Plus />
		<span> New property </span>
	{/snippet}

	<MenuTitle title="Property type" class="md:sr-only" divider={false} />
	<div class="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-1">
		{#each Object.values(PropertyType) as propertyType}
			<Button theme="ghost" variant="menu" onclick={() => addProperty(propertyType)}>
				<PropertyIcon key={propertyType} />

				<span>
					{capitalizeFirstLetter(propertyType)}
				</span>
			</Button>
		{/each}
	</div>
</AdaptiveWrapper>
