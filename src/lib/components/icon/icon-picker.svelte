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
		Film
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
		film: Film
	};
</script>

<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';

	export let name: string;
	export let onIconChange: (icon: string) => void;
	let open = false;
</script>

<Popover.Root bind:open>
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="ghost" size="icon">
			<svelte:component this={icons[name]} class="icon icon-lg" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[180px]">
		<div class="grid grid-cols-4 gap-1">
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
