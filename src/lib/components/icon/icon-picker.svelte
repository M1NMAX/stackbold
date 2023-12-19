<script lang="ts" context="module">
	import {
		Smile,
		Heart,
		Star,
		Folder,
		Medal,
		Activity,
		AlarmClock,
		AlertTriangle,
		Anchor,
		Annoyed,
		Apple,
		Archive,
		Armchair,
		Angry,
		Axe
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
		axe: Axe,
		smile: Smile,
		folder: Folder,
		heart: Heart,
		star: Star,
		medal: Medal
	};

	export const ICON_COLORS: Colors = {
		GRAY: 'text-gray-700 dark:text-gray-100',
		RED: 'text-red-500',
		GREEN: 'text-green-500',
		BLUE: 'text-blue-500'
	};
</script>

<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import type { Colors } from '$lib/types';
	import { Color, type Icon } from '@prisma/client';

	export let name: string;
	export let color: Color = 'GRAY';
	export let onIconChange: (icon: Icon) => void;
	let open = false;

	function onClickIconAndColor(name: string, color: string) {
		const colorCasted = color as Color;
		onIconChange({ name, color: colorCasted });
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="ghost" size="icon">
			<svelte:component this={icons[name]} class={cn('icon-lg', ICON_COLORS[color])} />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[180px]">
		<div class="grid grid-cols-4 gap-1">
			{#each Object.keys(icons) as key}
				<Popover.Root>
					<Popover.Trigger asChild let:builder>
						<Button builders={[builder]} variant="ghost" size="icon">
							<svelte:component this={icons[key]} class="icon-md" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-[180px] grid grid-cols-4 gap-1">
						{#each Object.entries(ICON_COLORS) as [colorKey, colorValue]}
							<Button
								variant="ghost"
								size="icon"
								on:click={() => onClickIconAndColor(key, colorKey)}
							>
								<svelte:component this={icons[key]} class={cn('icon-md', colorValue)} />
							</Button>
						{/each}
					</Popover.Content>
				</Popover.Root>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
