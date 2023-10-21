<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-french-toast';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

	onMount(() => {
		themeChange(false); //  false parameter is required for svelte
	});
</script>

<slot />

<Toaster />
