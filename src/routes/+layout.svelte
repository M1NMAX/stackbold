<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { mediaQuery } from 'svelte-legos';
	import { setScreenState } from '$lib/components/view';

	const isDesktop = setScreenState(mediaQuery('(min-width: 768px)'));

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
<Toaster position={$isDesktop ? 'top-center' : 'bottom-center'} richColors />
<slot />
