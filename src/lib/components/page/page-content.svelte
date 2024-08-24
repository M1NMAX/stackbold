<script lang="ts">
	import { cn } from '$lib/utils';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div
	on:scroll
	class={cn('h-full w-full mx-auto p-2 pb-10 lg:p-4 space-y-2 overflow-y-auto', className)}
>
	<slot />
</div>
