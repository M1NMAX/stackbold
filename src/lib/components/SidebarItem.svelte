<script lang="ts">
	export let href = '';
	export let active = false;
	export let label: string;
</script>

<a
	{href}
	class={`${
		active && 'rounded-l-md border-r-2 border-green-400 bg-gray-300 dark:bg-gray-600'
	} flex items-center space-x-4 p-1.5 hover:rounded-l-md hover:bg-gray-300
     dark:hover:bg-gray-500  transition duration-75 dark:text-gray-400`}
>
	<slot name="icon" />

	<span class="font-semibold">
		{label}
	</span>
</a>
