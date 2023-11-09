<script lang="ts">
	import { tick } from 'svelte';
	import { capitalizeFirstLetter, clickOutside } from '$lib/utils';
	import type { Color } from '@prisma/client';
	import type { Colors } from '$lib/types';

	export let value: Color = 'GRAY';
	export let onChange: (color: Color) => void;

	const colors: Colors = {
		GRAY: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
		RED: 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-300',
		GREEN: 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300',
		BLUE: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
	};

	let ddActive = false;

	let windowHeight: number;
	let top: boolean;

	let ddHeight = 158;
	let inputHeight: number;

	const toggleDropdown = async (e: MouseEvent) => {
		if (
			e.clientY + inputHeight < ddHeight ||
			windowHeight - ddHeight - inputHeight - e.clientY > 0
		) {
			top = false;
		} else {
			top = true;
		}

		ddActive = !ddActive;

		await tick();
		if (ddActive) {
			//document.querySelector('.color-block.active').focus();
		}
	};

	const clickOutsideDropdown = () => (ddActive = false);

	const handleChange = (newValue: String) => {
		value = newValue as Color;
		ddActive = false;
		onChange(value);
	};
</script>

<div class="relative">
	<button
		bind:clientHeight={inputHeight}
		class="flex items-center space-x-0.5 rounded bg-white border border-gay-50"
		on:click={(e) => toggleDropdown(e)}
		class:fake-focus={ddActive}
	>
		<div class={`${colors[value]} border-none rounded w-6 h-6 text-xs`} />

		<!-- <CaretDownSolid size="xs" class="text-gray-500" /> -->
	</button>

	{#if ddActive}
		<div
			class:top
			bind:clientHeight={ddHeight}
			class="absolute z-10 bottom-10 p-1 bg-white rounded border border-gray-500"
			use:clickOutside
			on:clickoutside={clickOutsideDropdown}
		>
			<div class="flex flex-col items-start space-y-1">
				{#each Object.entries(colors) as [key, value]}
					<button
						on:click={() => handleChange(key)}
						class="w-full flex items-center space-x-2 py-0.5 px-1 rounded hover:bg-gray-100"
					>
						<div class={`${value} h-5 w-5 rounded`} />

						<div>{capitalizeFirstLetter(key)}</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
