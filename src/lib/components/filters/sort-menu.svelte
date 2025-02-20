<script module>
	import {
		ArrowDownAZ,
		ArrowDownZA,
		CalendarArrowDown,
		CalendarArrowUp,
		ClockArrowDown,
		ClockArrowUp,
		type Icon as IconType
	} from 'lucide-svelte';

	const icons: { [idx: string]: typeof IconType } = {
		'name-asc': ArrowDownAZ,
		'name-desc': ArrowDownZA,
		'updatedAt-asc': ClockArrowDown,
		'updatedAt-desc': ClockArrowUp,
		'createdAt-asc': CalendarArrowDown,
		'createdAt-desc': CalendarArrowUp
	};
</script>

<script lang="ts" generics="T">
	import { buttonVariants, HSeparator, Menu, Radio } from '$lib/components/base/index.js';
	import type { SortOption } from '$lib/utils/sort';
	import { ModalState } from '$lib/states/index.js';

	type Props = {
		options: SortOption<T>[];
		value: SortOption<T>;
	};

	let { value = $bindable(), options }: Props = $props();

	const CurrentIcon = $derived(icons[`${value.field.toString()}-${value.order}`]);

	const menuState = new ModalState();

	function isSelected(opt: string) {
		return opt === `${value.field.toString()}-${value.order}`;
	}
</script>

<Menu
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'secondary' })}
	align="end"
>
	{#snippet trigger()}
		<CurrentIcon />
		<span class="hidden md:block">
			{value.label}
		</span>
	{/snippet}
	<p class="py-1.5 px-2 text-sm font-semibold">Sort by</p>

	<HSeparator />

	{#each options as option}
		{@const optValue = `${option.field.toString()}-${option.order}`}
		{@const Icon = icons[optValue]}
		<!-- svelte-ignore a11y_click_events_have_key_events -->

		<Radio
			checked={isSelected(optValue)}
			onclick={() => {
				value = { ...option };
				menuState.close();
			}}
		>
			<Icon />
			<span class="grow">{option.label} </span>
		</Radio>
	{/each}
</Menu>
