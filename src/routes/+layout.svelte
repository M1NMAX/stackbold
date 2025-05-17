<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { setDeleteModalState } from '$lib/states/index.js';
	import { setToastState } from '$lib/states/index.js';
	import { AlertDialog, Toaster } from '$lib/components/base/index.js';

	let { children } = $props();

	setToastState();

	const deleteModal = setDeleteModalState();

	async function handleDelete() {
		if (deleteModal.detail.type) {
			await deleteModal.detail.fun();
			deleteModal.close();
		}
	}

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
<Toaster />

{@render children()}

{#if deleteModal.detail.type}
	<AlertDialog
		bind:open={deleteModal.isOpen}
		title="Delete"
		description={`Are you sure you want to delete this ${deleteModal.detail.type}?`}
		onClickConfirm={handleDelete}
	></AlertDialog>
{/if}
