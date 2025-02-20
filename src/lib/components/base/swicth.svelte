<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	type Props = HTMLInputAttributes & {
		id: string;
	};

	let { id, checked = $bindable(false), ...rest }: Props = $props();
</script>

<label class="relative inline-block h-5 w-9">
	<input {id} type="checkbox" bind:checked {...rest} class="h-0 w-0 opacity-0 peer" />
	<span
		class={[
			'absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full bg-gray-300 dark:bg-gray-800 transition duration-100',
			'before:absolute before:content-[""] before:h-4 before:w-4 before:left-[2px] before:bottom-[2px]',
			'before:rounded-full before:bg-white before:dark:bg-black before:transition duration-100',
			'peer-checked:bg-primary',
			'peer-focus:shadow-lg',
			'peer-checked:before:translate-x-4 peer-checked:before:duration-100'
		]}
	>
	</span>
</label>
