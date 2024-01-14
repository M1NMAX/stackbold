<script lang="ts">
	import '../app.css';

	import { onMount } from 'svelte';
	import Toaster from '$lib/components/feedback/Toaster.svelte';
	import { ModeWatcher } from 'mode-watcher';

	async function detectSWUpdate() {
		const registration = await navigator.serviceWorker.ready;

		registration.addEventListener('updatefound', () => {
			const newSW = registration.installing;

			newSW?.addEventListener('statechange', () => {
				if (newSW.state === 'installed') {
					if (confirm('New update available! Reload to update?')) {
						newSW.postMessage({ type: 'SKIP_WAITING' });
						window.location.reload();
					}
				}
			});
		});
	}

	onMount(() => {
		detectSWUpdate();
	});
</script>

<ModeWatcher />
<Toaster />
<slot />
