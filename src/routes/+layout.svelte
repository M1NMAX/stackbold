<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import { setScreenSizeState } from '$lib/components/screen';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { setDeleteModalState } from '$lib/components/modal';
	import { buttonVariants } from '$lib/components/ui/button';

	let { children } = $props();

	const isLargeScreen = setScreenSizeState();

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
<Toaster position={isLargeScreen.current ? 'top-center' : 'bottom-center'} richColors />

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
				<AlertDialog.Action
					class={buttonVariants({ variant: 'destructive' })}
					onclick={handleDelete}
				>
					Continue
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
