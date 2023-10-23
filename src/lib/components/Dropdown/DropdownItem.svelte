<script lang="ts">
	export let href: string | undefined = undefined;
	let className: string = '';
	export { className as class };
</script>

<li>
	<svelte:element
		this={href ? 'a' : 'button'}
		{href}
		role={href ? 'link' : 'button'}
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
