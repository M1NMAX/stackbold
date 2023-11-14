<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export let href: string | undefined = undefined;
	export let type: HTMLButtonAttributes['type'] = 'button';
	let className: string = '';
	export { className as class };
</script>

<li>
	<svelte:element
		this={href ? 'a' : 'button'}
		{href}
		role={href ? 'link' : 'button'}
		type={href ? undefined : type}
		class={`dropdown-item ${className}`}
		on:click
		on:change
		on:keydown
		on:keyup
		on:touchstart|passive
		on:touchend
		on:touchcancel
		on:mouseenter
		on:mouseleave
	>
		<slot />
	</svelte:element>
</li>
