<script lang="ts">
	export let group: string | number = '';
	export let value: string | number = '';
</script>

<label
	class={`btn btn-sm rounded-sm ${
		group === value ? '   text-gray-100  bg-gray-800 hover:bg-gray-700 ' : 'bg-gray-100'
	}`}
>
	<input
		type="radio"
		bind:group
		{value}
		{...$$restProps}
		class="sr-only"
		on:keyup
		on:keydown
		on:keypress
		on:focus
		on:blur
		on:click
		on:mouseover
		on:mouseenter
		on:mouseleave
		on:paste
		on:change
	/>
	<slot />
</label>
