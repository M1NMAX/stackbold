<script lang="ts">
	import { tm } from '$lib/utils/index.js';

	type Props = {
		class?: string;
	};

	let { class: className }: Props = $props();
</script>

<hr class={tm('bg-muted my-1 h-px mx-3 md:mx-0', className)} />
