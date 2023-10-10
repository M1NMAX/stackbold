<script lang="ts">
	import { Badge, type Colors } from 'flowbite-svelte';
	import { CheckCircleSolid } from 'flowbite-svelte-icons';

	export let name: string;
	export let color: Colors;
	export let type: string;
	export let value: string;
</script>

<Badge {color} class="items-center text-base font-medium">
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
</Badge>
