<script module>
	import ArrowDownAZ from 'lucide-svelte/icons/arrow-down-az';
	import ArrowDownZA from 'lucide-svelte/icons/arrow-down-za';
	import CalendarArrowDown from 'lucide-svelte/icons/calendar-arrow-down';
	import CalendarArrowUp from 'lucide-svelte/icons/calendar-arrow-up';
	import ClockArrowDown from 'lucide-svelte/icons/clock-arrow-down';
	import ClockArrowUp from 'lucide-svelte/icons/clock-arrow-up';
	import { type Icon as IconType } from 'lucide-svelte';

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
	import {
		AdaptiveWrapper,
		buttonVariants,
		HSeparator,
		Label,
		MenuTitle,
		RadioGroup,
		RadioGroupItem
	} from '$lib/components/base/index.js';
	import type { OrderType, SortOption } from '$lib/utils/sort';
	import { ModalState } from '$lib/states/index.js';
	import { useId } from '$lib/utils';

	type Props = {
		options: SortOption<T>[];
		value: SortOption<T>;
	};

	let { value = $bindable(), options }: Props = $props();

	const valueStr = $derived(joinOptionProperties(value));
	const CurrentIcon = $derived(icons[joinOptionProperties(value, 1)]);

	const menuState = new ModalState();

	function handleChange(v: string) {
		const [label, field, order] = v.split('-');
		const option: SortOption<T> = {
			label,
			field: field as keyof T,
			order: order as OrderType
		};

		value = { ...option };
		menuState.close();
	}

	function joinOptionProperties(opt: SortOption<T>, idx: number = 0) {
		let result = '';
		for (let i = idx; i < Object.keys(opt).length; i++) {
			result += Object.values(opt)[i].toString() + '-';
		}
		return result.slice(0, result.length - 1);
	}
</script>

<AdaptiveWrapper
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'secondary' })}
	floatingAlign="end"
>
	{#snippet trigger()}
		<CurrentIcon />
		<span class="hidden md:block">
			{value.label}
		</span>
	{/snippet}
	<MenuTitle title="Sort by" />

	<RadioGroup value={valueStr} onchange={handleChange}>
		{#each options as option}
			{@const optId = useId('sort-menu')}
			{@const optValue = joinOptionProperties(option)}
			{@const Icon = icons[joinOptionProperties(option, 1)]}
			<Label for={optId} compact hoverEffect>
				<Icon />
				<span class="grow">{option.label} </span>
				<RadioGroupItem id={optId} value={optValue}></RadioGroupItem>
			</Label>
		{/each}
	</RadioGroup>
</AdaptiveWrapper>
