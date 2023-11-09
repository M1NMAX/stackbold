<script lang="ts">
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
		active && 'border-r-2 border-primary bg-gray-200 dark:bg-gray-600'
	} w-full flex items-center space-x-2.5 py-0.5 px-1.5  hover:bg-gray-300
     dark:hover:bg-gray-500  transition duration-75 dark:text-gray-400`}
>
	<slot name="icon" />

	<span class="font-semibold">
		{label}
	</span>
</svelte:element>
