<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import { getViewState, ViewIcon } from './index.js';
	import { ViewType } from '@prisma/client';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		MenuTitle
	} from '$lib/components/base/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { capitalizeFirstLetter } from '$lib/utils/index.js';

	const viewState = getViewState();
	const wrapper = new ModalState();

	async function addView(viewType: ViewType) {
		wrapper.close();
		await viewState.addView(viewType);
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
		<span> New view </span>
	{/snippet}

	<MenuTitle title="View type" class="md:sr-only" divider={false} />
	<div class="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-1">
		{#each Object.values(ViewType) as viewType}
			<Button theme="ghost" variant="menu" onclick={() => addView(viewType)}>
				<ViewIcon key={viewType} />

				<span>
					{capitalizeFirstLetter(viewType)}
				</span>
			</Button>
		{/each}
	</div>
</AdaptiveWrapper>
