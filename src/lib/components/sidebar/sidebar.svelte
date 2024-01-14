<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	export let ariaLabel: string = 'Sidebar';
	let className: string = '';
	export { className as class };
</script>

<aside class={twMerge('w-64 h-screen z-20 transition-all', className)} aria-label={ariaLabel}>
	<slot />
</aside>
