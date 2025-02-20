<script lang="ts">
	import { INPUT_ICONS } from '$lib/constant/index.js';

	type Props = {
		id: string;
		name: string;
		icon?: string;
	};

	let { id, name, icon }: Props = $props();
</script>

<label for={id} class="grow flex items-center gap-x-1.5 px-2 py-1.5 select-none">
	{#if icon}
		{@const Icon = INPUT_ICONS[icon]}
		<Icon class="size-4" />
	{/if}

	<span class="font-semibold text-sm"> {name} </span>
</label>
