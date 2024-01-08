<script lang="ts">
	import { cn } from '$lib/utils';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<main class={cn('h-screen w-full p-0 lg:p-1 bg-secondary text-secondary-foreground', className)}>
	<div class="h-full w-full p-1 bg-card rounded-md text-secondary-foreground overflow-hidden">
		<slot />
	</div>
</main>
