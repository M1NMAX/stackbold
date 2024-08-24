<script lang="ts">
	import { fly } from 'svelte/transition';
	import { sineIn } from 'svelte/easing';
	import { cn } from '$lib/utils';

	export let id: string = 'drawer-id';
	export let open: boolean = false;

	let className: string | undefined = undefined;
	export { className as class };
</script>

{#if open}
	<div
		{id}
		{...$$restProps}
		class={cn('absolute inset-y-0 right-0 z-20 w-80 p-1 overflow-y-auto bg-secondary', className)}
		transition:fly={{ x: 320, duration: 300, easing: sineIn }}
		tabindex="-1"
		aria-controls={id}
		aria-labelledby={id}
	>
		<div class="h-full flex flex-col space-y-1.5 p-2 rounded-md bg-card">
			<slot {open} />
		</div>
	</div>
{/if}
