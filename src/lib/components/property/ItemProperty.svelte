<script lang="ts">
	import type { Color, Colors } from '$lib/types';

	export let name: string;
	export let color: Color = 'gray';
	export let type: string;
	export let value: string;

	const colors: Colors = {
		gray: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
		red: 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-300',
		blue: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		green: 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300'
	};
</script>

{#if type === 'CHECKBOX'}
	<label
		class={` ${colors[color]} label rounded inline-flex items-center justify-center space-x-1 text-sm   font-semibold px-1 py-0.5  `}
	>
		<input
			type="checkbox"
			checked={value === 'true'}
			class="checkbox checkbox-xs checkbox-primary"
		/>
		<span class="label-text font-semibold">{name} </span>
	</label>
{:else}
	<div
		class={` ${colors[color]} rounded inline-flex items-center justify-center space-x-1 text-sm font-semibold px-1 py-0.5 `}
	>
		{value}
	</div>
{/if}
