<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props();
</script>

<RadioGroupPrimitive.Item bind:ref class={className} {...restProps}>
	{#snippet children({ checked })}
		<div class="flex items-center justify-center">
			{#if checked}
				<Check class="size-5" />
			{/if}
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
