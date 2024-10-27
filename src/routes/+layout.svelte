<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { mediaQuery, setScreenState } from '$lib/components/screen';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { setDeleteModalState } from '$lib/components/modal';
	import { Button } from '$lib/components/ui/button';

	let { children } = $props();

	const isDesktop = setScreenState(mediaQuery(true, '(min-width: 768px)'));

	const deleteModal = setDeleteModalState();

	async function handleDelete() {
		if (deleteModal.detail.type) {
			deleteModal.detail.fun();
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
<Toaster position={$isDesktop ? 'top-center' : 'bottom-center'} richColors />

{@render children()}

{#if deleteModal.detail.type}
	<AlertDialog.Root bind:open={deleteModal.isOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete</AlertDialog.Title>
				<AlertDialog.Description class="text-lg">
					Are you sure you want to delete this {deleteModal.detail.type} ?
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action asChild let:builder>
					<Button builders={[builder]} variant="destructive" on:click={handleDelete}>
						Continue
					</Button>
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
