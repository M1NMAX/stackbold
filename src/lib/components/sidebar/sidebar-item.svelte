<script lang="ts">
	import { cn } from '$lib/utils';

	export let href: string | undefined = undefined;
	export let active = false;
	export let label: string;
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	{href}
	role={href ? 'link' : 'button'}
	on:click
	on:change
	on:keydown
	on:keyup
	on:touchstart|passive
	on:touchend
	on:touchcancel
	on:mouseenter
	on:mouseleave
	class={`${
		active && 'border-r-2 border-primary bg-secondary '
	} w-full flex items-center space-x-1.5 py-0.5 px-1.5  hover:bg-secondary/95
       transition duration-75 text-secondary-foreground`}
>
	<slot name="icon" />

	<span class={cn('font-semibold', active && 'text-primary')}>
		{label}
	</span>
</svelte:element>
