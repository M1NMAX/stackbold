<script lang="ts" generics="T">
	import {
		AdaptiveWrapper,
		buttonVariants,
		Label,
		MenuTitle,
		RadioGroup,
		RadioGroupItem
	} from '$lib/components/base/index.js';
	import type { OrderType, SortOption } from '$lib/utils/sort';
	import { ModalState } from '$lib/states/index.js';
	import { useId } from '$lib/utils';
	import { SORT_ICONS } from '$lib/constant/index.js';

	type Props = {
		options: SortOption<T>[];
		value: SortOption<T>;
	};

	let { value = $bindable(), options }: Props = $props();

	const valueStr = $derived(joinOptionProperties(value));
	const CurrentIcon = $derived(SORT_ICONS[joinOptionProperties(value, 1)]);

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
			{@const Icon = SORT_ICONS[joinOptionProperties(option, 1)]}
			<Label for={optId} compact hoverEffect>
				<Icon />
				<span class="grow">{option.label} </span>
				<RadioGroupItem id={optId} value={optValue}></RadioGroupItem>
			</Label>
		{/each}
	</RadioGroup>
</AdaptiveWrapper>
