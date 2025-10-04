<script lang="ts">
	import Menu from 'lucide-svelte/icons/menu';
	import { getSidebarState } from './index.js';
	import { Button } from '$lib/components/base/index.js';
	import { tm } from '$lib/utils/index.js';

	const sidebarState = getSidebarState();
</script>

<Button
	theme="secondary"
	variant="icon"
	onclick={() => sidebarState.open()}
	class={tm(sidebarState.isOpen ? 'hidden' : 'hidden lg:flex')}
>
	<Menu />
</Button>
