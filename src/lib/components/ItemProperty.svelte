<script lang="ts">
	import { CheckCircleSolid } from 'flowbite-svelte-icons';

	export let name: string;
	export let color: string;
	export let type: string;
	export let value: string;

	type BgColors = { [key: string]: string };

	const bgColors: BgColors = {
		gray: 'bg-gray-400',
		red: 'bg-red-500',
		green: 'bg-green-500',
		blue: 'bg-blue-500'
	};
</script>

<span class={`${bgColors[color]} items-center text-base font-medium p-0.5 rounded`}>
	{#if type === 'check'}
		<span class="flex space-x-2">
			<span>
				{name}
			</span>

			{#if value === 'true'}
				<CheckCircleSolid class="icon-xss" />
			{:else}
				<div class="w-5 h-5 border border-gray-400 rounded-full bg-white" />
			{/if}
		</span>
	{:else}
		{value}
	{/if}
</span>
