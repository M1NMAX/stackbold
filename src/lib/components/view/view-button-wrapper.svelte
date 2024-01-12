<script lang="ts">
	import { Root as RadioGroupRoot } from '$lib/components/ui/radio-group';
	import { cn } from '$lib/utils';
	import { setViewState } from '.';

	export let view: string | undefined = undefined;
	let className: string | undefined = undefined;
	export { className as class };

	const viewState = setViewState(view);
</script>

<RadioGroupRoot
	bind:value={view}
	onValueChange={(value) => ($viewState = value)}
	class={cn('h-9 flex gap-0.5 rounded-sm', className)}
>
	<slot />
</RadioGroupRoot>
