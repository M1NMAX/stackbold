<script lang="ts">
	import { cn } from '$lib/utils';

	export let isWrappered: boolean = false;

	let className: string | undefined = undefined;
	export { className as class };
</script>

{#if !isWrappered}
	<slot />
{:else}
	<span class={cn('h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold', className)}>
		<slot />
	</span>
{/if}
