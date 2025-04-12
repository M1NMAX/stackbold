<script lang="ts">
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		MenuTitle
	} from '$lib/components/base/index.js';
	import { tm } from '$lib/utils/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { COLLECTION_ICONS } from '$lib/constant';

	type Props = {
		name: string;
		onIconChange: (icon: string) => void;
	};

	let { name, onIconChange }: Props = $props();
	const menuState = new ModalState();

	const SelectedIcon = $derived(COLLECTION_ICONS[name]);
</script>

<AdaptiveWrapper
	floatingAlign="start"
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'ghost', variant: 'icon', className: '[&_svg]:size-7' })}
>
	{#snippet trigger()}
		<SelectedIcon />
	{/snippet}

	<MenuTitle title="Icons" class="md:sr-only" divider={false} />
	<div class="grid grid-cols-7 gap-2 mx-auto">
		{#each Object.keys(COLLECTION_ICONS) as key}
			{@const Icon = COLLECTION_ICONS[key]}
			<Button
				theme="ghost"
				variant="icon"
				onclick={() => {
					onIconChange(key);
					menuState.close();
				}}
				class={tm('[&_svg]:size-6 md:[&_svg]:size-5 p-1', key === name && 'bg-secondary')}
				aria-label={key}
			>
				<Icon />
			</Button>
		{/each}
	</div>
</AdaptiveWrapper>
