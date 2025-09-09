<script lang="ts">
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';

	type Props = {
		value?: string;
		placeholder?: string;
	};
	let { value = $bindable(), placeholder = 'Search', ...rest }: Props = $props();
</script>

<div class="relative w-full">
	<div class="absolute inset-y-0 pl-2 flex items-center pointer-events-none">
		<Search class="size-4" />
	</div>
	<input
		class="w-full h-9 px-8 text-base font-semibold rounded-sm bg-secondary focus:placeholder:text-secondary-foreground focus:outline-none"
		{placeholder}
		{...rest}
		bind:value
	/>

	{#if value && value.length > 0}
		<button class="absolute inset-y-0 right-0 pr-2 flex items-center" onclick={() => (value = '')}>
			<X class="size-4" />
		</button>
	{/if}
</div>
