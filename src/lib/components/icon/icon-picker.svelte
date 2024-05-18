<script lang="ts" context="module">
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
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { getScreenState } from '../view';

	export let name: string;
	export let onIconChange: (icon: string) => void;
	const isDesktop = getScreenState();

	let open = false;
</script>

{#if $isDesktop}
	<Popover.Root bind:open>
		<Popover.Trigger asChild let:builder>
			<Button builders={[builder]} variant="ghost" size="icon">
				<svelte:component this={icons[name]} class="icon icon-lg" />
			</Button>
		</Popover.Trigger>
		<Popover.Content align="start">
			<div class="pb-2 text-center font-semibold">Collection Icon</div>
			<div class="grid grid-cols-7 gap-2">
				{#each Object.keys(icons) as key}
					<Button
						variant="ghost"
						size="icon"
						on:click={() => {
							onIconChange(key);
							open = false;
						}}
					>
						<svelte:component this={icons[key]} class="icon-md" />
					</Button>
				{/each}
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<Drawer.Root>
		<Drawer.Trigger asChild let:builder>
			<Button builders={[builder]} variant="ghost" size="icon">
				<svelte:component this={icons[name]} class="icon icon-lg" />
			</Button>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header>
				<div class="text-center font-semibold">Collection Icon</div>
			</Drawer.Header>
			<Drawer.Footer>
				<div class="grid grid-cols-7 gap-4 mx-auto">
					{#each Object.keys(icons) as key}
						<Button
							variant="ghost"
							on:click={() => {
								onIconChange(key);
								open = false;
							}}
							class="h-10 w-10 p-1.5"
						>
							<svelte:component this={icons[key]} class="icon-lg" />
						</Button>
					{/each}
				</div>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
