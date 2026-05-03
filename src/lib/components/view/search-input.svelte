<script lang="ts">
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import { Button } from '$lib/components/base/index.js';

	type Props = {
		value?: string;
		placeholder?: string;
	};
	let { value = $bindable(), placeholder = 'Search', ...rest }: Props = $props();
</script>

<div class="relative w-full">
	<div class="input-left-icon">
		<Search />
	</div>
	<input
		class="input secondary icon-left icon-right !h-9 lg:!h-9"
		{placeholder}
		{...rest}
		bind:value
	/>

	{#if value && value.length > 0}
		<Button
			type="button"
			theme="ghost"
			variant="icon"
			class="absolute inset-y-0 right-0"
			onclick={() => (value = '')}
		>
			<X />
		</Button>
	{/if}
</div>
