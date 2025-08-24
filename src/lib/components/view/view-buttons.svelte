<script lang="ts">
	import type { View } from '@prisma/client';
	import { tm, useId } from '$lib/utils/index.js';
	import {
		buttonVariants,
		Drawer,
		Label,
		MenuTitle,
		RadioGroup,
		RadioGroupItem
	} from '$lib/components/base/index.js';
	import { VIEW_ICONS } from '$lib/constant/index.js';
	import { ModalState } from '$lib/states/index.js';

	type Props = {
		views: View[];
		value: string;
		class?: string;
		onchange: (v: string) => void;
	};

	let { views, value, onchange, class: className }: Props = $props();
	const view = $derived.by(() => views.find((v) => v.shortId.toString() === value)!);
	const CurrentIcon = $derived(VIEW_ICONS[view.type.toLowerCase()]);

	const id = useId('collection-views');
	const menuState = new ModalState();
</script>

<RadioGroup
	{value}
	{onchange}
	class={tm('hidden md:flex h-9 gap-0.5 rounded-md bg-secondary/50', className)}
>
	{#each views as view}
		{@const Icon = VIEW_ICONS[view.type.toLowerCase()]}

		<Label
			for={`view-${view.id}`}
			class={tm(
				'flex items-center justify-center py-1.5 px-2 rounded-md text-secondary-foreground cursor-pointer',
				+value === view.shortId && 'bg-secondary border border-secondary'
			)}
		>
			<RadioGroupItem value={view.shortId.toString()} id={`view-${view.id}`} class="sr-only" />
			<Icon />
			<span class="grow font-semibold"> {view.name} </span>
		</Label>
	{/each}
</RadioGroup>

<div class="block md:hidden">
	<button
		{id}
		type="button"
		onclick={() => menuState.toggle()}
		class={buttonVariants({ theme: 'secondary' })}
	>
		<CurrentIcon />
		<span>{view.name} </span>
	</button>

	<Drawer bind:open={menuState.isOpen}>
		<MenuTitle title="Views" />
		<RadioGroup
			{value}
			onchange={(v) => {
				menuState.close();
				onchange(v);
			}}
		>
			{#each views as view}
				{@const Icon = VIEW_ICONS[view.type.toLowerCase()]}
				<Label for={view.id} compact hoverEffect>
					<Icon />
					<span class="grow">{view.name} </span>
					<RadioGroupItem id={view.id} value={view.shortId.toString()}></RadioGroupItem>
				</Label>
			{/each}
		</RadioGroup>
	</Drawer>
</div>
