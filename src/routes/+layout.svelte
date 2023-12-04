<script lang="ts">
	import '../app.css';

	import Toaster from '$lib/components/feedback/Toaster.svelte';
	import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher />
<Toaster />
<slot />
