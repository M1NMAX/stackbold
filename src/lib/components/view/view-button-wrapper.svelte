<script lang="ts">
	import { Root as RadioGroupRoot } from '$lib/components/ui/radio-group';
	import { cn } from '$lib/utils';

	export let value: string | undefined = undefined;
	let className: string | undefined = undefined;
	export { className as class };
</script>

<RadioGroupRoot bind:value class={cn('h-9 flex gap-0.5 rounded-sm', className)}>
	<slot />
</RadioGroupRoot>
