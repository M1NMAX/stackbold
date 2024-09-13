<script lang="ts">
	import { Search } from 'lucide-svelte';

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
		class="w-full h-9 pl-10 text-base font-semibold rounded-sm bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
		{placeholder}
		{...rest}
		bind:value
	/>
</div>
