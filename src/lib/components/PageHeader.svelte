<script lang="ts">
	import { cn } from '$lib/utils';

	let className: string | undefined = undefined;
</script>

<div class={cn('flex justify-end items-center space-x-1.5', className)}>
	<slot />
</div>
