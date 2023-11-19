<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-french-toast';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';
	import { ModeWatcher } from 'mode-watcher';

	onMount(() => {
		themeChange(false); //  false parameter is required for svelte
	});
</script>

<ModeWatcher />
<slot />

<Toaster />
