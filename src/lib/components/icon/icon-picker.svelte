<script module lang="ts">
	import {
		Activity,
		AlarmClock,
		AlertTriangle,
		Anchor,
		Annoyed,
		Apple,
		Archive,
		Armchair,
		Angry,
		Axe,
		Award,
		Baby,
		Smile,
		Heart,
		Star,
		Folder,
		Medal,
		Backpack,
		Banana,
		CalendarDays,
		ListTodo,
		BookOpenCheck,
		Clapperboard,
		Film,
		Banknote,
		Landmark,
		Gem,
		Wallet
	} from 'lucide-svelte';

	export const icons: { [index: string]: any } = {
		activity: Activity,
		alarm: AlarmClock,
		alert: AlertTriangle,
		anchor: Anchor,
		annoyed: Annoyed,
		apple: Apple,
		archive: Archive,
		armchair: Armchair,
		angry: Angry,
		award: Award,
		axe: Axe,
		baby: Baby,
		banana: Banana,

		calendar: CalendarDays,
		todo: ListTodo,
		smile: Smile,
		folder: Folder,
		heart: Heart,
		star: Star,
		medal: Medal,
		backpack: Backpack,
		taskBook: BookOpenCheck,
		clapperboard: Clapperboard,
		film: Film,
		backnote: Banknote,
		landmark: Landmark,
		gem: Gem,
		wallet: Wallet
	};
</script>

<script lang="ts">
	import { AdaptiveWrapper, Button, buttonVariants } from '$lib/components/base/index.js';
	import { tm } from '$lib/utils/index.js';
	import { ModalState } from '$lib/states/index.js';

	type Props = {
		name: string;
		onIconChange: (icon: string) => void;
	};

	let { name, onIconChange }: Props = $props();
	const menuState = new ModalState();

	const SelectedIcon = $derived(icons[name]);
</script>

<AdaptiveWrapper
	floatingAlign="start"
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'ghost', variant: 'icon', className: '[&_svg]:size-7' })}
>
	{#snippet trigger()}
		<SelectedIcon />
	{/snippet}

	<p class="menu-header">Icons</p>
	<div class="grid grid-cols-7 gap-2 mx-auto">
		{#each Object.keys(icons) as key}
			{@const Icon = icons[key]}
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
