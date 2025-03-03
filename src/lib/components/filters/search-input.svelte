<script lang="ts">
	import { Search, SquareX } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	type Props = {
		value?: string;
		placeholder?: string;
	};
	let { value = $bindable(), placeholder, ...rest }: Props = $props();
</script>

<!-- TODO: turn responsive -->
<div class="relative w-full">
	<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
		<Search class="text-primary icon-sm" />
	</div>
	<input
		class="w-full h-9 px-10 text-base font-semibold rounded-sm bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
		{placeholder}
		{...rest}
		bind:value
	/>

	{#if value && value.length > 0}
		<Button
			variant="ghost"
			class="absolute inset-y-0 right-0 flex items-center [&_svg]:size-6"
			onclick={() => (value = '')}
		>
			<SquareX class="text-primary" />
		</Button>
	{/if}
</div>
