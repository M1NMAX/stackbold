<script lang="ts">
	import { Search } from 'lucide-svelte';

	export let value: string | undefined = undefined;
	export let placeholder: string | undefined = undefined;
</script>

<!-- TODO: turn responsive -->
<div class="relative w-full">
	<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
		<Search class="text-primary icon-sm" />
	</div>
	<input
		class="w-full h-9 pl-10 text-base font-semibold rounded bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
		{placeholder}
		bind:value
		on:input
		on:change
		on:keydown
		on:keypress
	/>
</div>
