<script lang="ts">
	import { tm } from '$lib/utils/index.js';

	type Props = {
		seed?: string;
		class?: string;
	};

	let { seed = 'stackbold', class: className }: Props = $props();
	const src = $derived(`https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`);
</script>

<img
	{src}
	alt="user avatat"
	class={tm('size-9 lg:size-8 rounded-full object-contain', className)}
/>
