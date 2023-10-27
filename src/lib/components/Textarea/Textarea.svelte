<script lang="ts">
	import autosize from 'autosize';
	import type { Action } from 'svelte/action';

	export let value: string | number | string[] | null | undefined = undefined;

	let className: string = '';
	export { className as class };

	const action: Action = (node) => {
		autosize(node);

		return {
			destroy() {
				autosize.destroy(node);
			}
		};
	};
</script>

<textarea
	use:action
	bind:value
	on:blur
	on:change
	on:click
	on:contextmenu
	on:focus
	on:input
	on:keydown
	on:keypress
	on:keyup
	on:mouseenter
	on:mouseleave
	on:mouseover
	on:paste
	rows="1"
	{...$$restProps}
	class={className}
/>
