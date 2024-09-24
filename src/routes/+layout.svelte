<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { mediaQuery, setScreenState } from '$lib/components/view';

	let { children } = $props();

	const isDesktop = setScreenState(mediaQuery(true, '(min-width: 768px)'));

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

	$effect(() => {
		detectSWUpdate();
	});
</script>

<ModeWatcher />
<Toaster position={$isDesktop ? 'top-center' : 'bottom-center'} richColors />

{@render children()}
