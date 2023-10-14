<script lang="ts">
	import { Button } from 'flowbite-svelte';

	export let extraClass = '';
</script>

<Button on:click color="alternative" class={`${extraClass} p-1.5 rounded `}>
	<slot />
</Button>
