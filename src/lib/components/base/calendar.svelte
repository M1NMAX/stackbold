<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
	import { buttonVariants } from './index.js';
	import { createMonth } from '$lib/states/index.js';
	import { WEEK_DAYS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		value?: CalendarDate;
		onchange?: (date: CalendarDate) => void;
	};

	let { value = $bindable(today(getLocalTimeZone())), onchange }: Props = $props();

	let pointer = $state(value);
	const month = $derived(createMonth(pointer, value));

	function previousMonth() {
		pointer = pointer.subtract({ months: 1 });
	}

	function nextMonth() {
		pointer = pointer.add({ months: 1 });
	}

	function onClickDay(day: CalendarDate) {
		value = day;
		onchange?.(value);
	}
</script>

<div class="flex flex-col gap-y-2 p-2 rounded-md bg-background">
	<div class="grid grid-cols-7 grid-flow-rows gap-x-4 md:gap-x-2">
		<button
			type="button"
			class={buttonVariants({ theme: 'outline', variant: 'icon' })}
			onclick={previousMonth}
		>
			<ChevronLeft />
		</button>

		<span class="col-span-5 text-center text-sm font-medium">
			{month.title}
		</span>

		<button
			type="button"
			class={buttonVariants({ theme: 'outline', variant: 'icon' })}
			onclick={nextMonth}
		>
			<ChevronRight />
		</button>
	</div>

	<div class="grid grid-cols-7 grid-flow-rows">
		{#each Object.keys(WEEK_DAYS) as key (key)}
			<span
				class={[
					' flex items-center justify-center',
					'text-[0.8rem] font-normal text-muted-foreground'
				]}
			>
				{WEEK_DAYS[+key].slice(0, 2)}
			</span>
		{/each}
	</div>
	<div class="grid grid-cols-7 grid-flow-rows gap-y-2 gap-x-4 md:gap-x-2">
		{#each month.days as day}
			<button
				type="button"
				disabled={day.isDisabled}
				onclick={() => onClickDay(day.date)}
				class={tm(
					buttonVariants({
						theme: 'ghost',
						variant: 'icon'
					}),
					'size-9 flex items-center justify-center rounded-md text-sm',
					day.isSelected && 'bg-primary hover:bg-primary/90',
					day.isSelected && day.isDisabled && 'bg-accent/70',
					day.isToday && 'bg-accent'
				)}
			>
				{day.date.day}
			</button>
		{/each}
	</div>
</div>
