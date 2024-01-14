<script lang="ts">
	import { cn } from '$lib/utils';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn('h-full w-full mx-auto p-2 pb-10 lg:p-8 space-y-2 overflow-y-auto', className)}>
	<slot />
</div>
