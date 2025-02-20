<script lang="ts">
	import { Button, Dialog } from './index.js';

	type Props = {
		title: string;
		description: string;
		open: boolean;
		closeOnConfirm?: boolean;
		onClickConfirm: () => void;
	};

	let {
		title,
		description,
		open = $bindable(false),
		closeOnConfirm = false,
		onClickConfirm
	}: Props = $props();

	function close() {
		open = false;
	}

	function handleConfirm() {
		onClickConfirm();
		if (closeOnConfirm) close();
	}
</script>

<Dialog bind:open dismissable={false} class="flex flex-col gap-y-2" {title}>
	<p class="text-muted-foreground text-lg">
		{description}
	</p>

	<div class="flex items-center justify-end space-x-2">
		<Button theme="outline" onclick={close}>Cancel</Button>
		<Button theme="destructive" onclick={handleConfirm}>Confirm</Button>
	</div>
</Dialog>
