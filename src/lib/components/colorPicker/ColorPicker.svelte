<script lang="ts">
	import { v4 as uuid } from 'uuid';

	import { clickOutside } from './clickOutside';
	import { tick, onMount } from 'svelte';

	export let id = uuid();
	export let value = '#5E7ABC';

	// Our color set
	let values = [
		['#DAAFE9', '#C7DBF5', '#AAD5FB', '#ADE5DA', '#B0EDC3', '#FDF0A4', '#F8D6A2'],
		['#C47ADA', '#90BAEE', '#75BAFA', '#72D5BF', '#73DE8C', '#FBE66E', '#F5B969'],
		['#AE44B7', '#5E7ABC', '#5E7ABC', '#4DACA9', '#63B75A', '#EDBD4A', '#EC9740'],
		['#501B87', '#021B6B', '#0C2794', '#337277', '#2F6A52', '#AE802F', '#AD6127']
	];

	let trigger = 'Escape';

	let ddActive = false;
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === trigger) ddActive = false;
	};

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

	const changeValue = (innerValue: string) => {
		value = innerValue;
		ddActive = false;
	};

	const keyboardGridNav = (e: KeyboardEvent, index: number) => {
		const focussedElement = document.activeElement?.id!;

		let myRow = parseInt(focussedElement.charAt(focussedElement.length - 3));
		let myIndex = parseInt(focussedElement.charAt(focussedElement.length - 1));
		let nextRow;
		let prevRow;
		let nextIndex;
		let prevIndex;

		let composedId = '';

		switch (e.key) {
			// left arrow
			case 'ArrowLeft':
				prevIndex = myIndex - 1;
				if (prevIndex > -1) {
					composedId = id + '-' + myRow + '-' + prevIndex;
					document.getElementById(composedId)?.focus();
				}
				break;
			// top arrow
			case 'ArrowUp':
				prevRow = myRow - 1;
				if (prevRow > -1) {
					composedId = id + '-' + prevRow + '-' + myIndex;
					document.getElementById(composedId)?.focus();
				}
				break;
			// right arrow
			case 'ArrowRight':
				nextIndex = myIndex + 1;
				if (nextIndex < values[0].length) {
					composedId = id + '-' + myRow + '-' + nextIndex;
					document.getElementById(composedId)?.focus();
				}
				break;
			// down arrow
			case 'ArrowDown':
				nextRow = myRow + 1;
				if (nextRow < values.length) {
					composedId = id + '-' + nextRow + '-' + myIndex;
					document.getElementById(composedId)?.focus();
				}
				break;
		}
	};
</script>

<div class="relative">
	<div class="flex h-9">
		<button
			bind:clientHeight={inputHeight}
			class="border border-gay-50 p-1 rounded mr-2 bg-white h-9"
			on:click={(e) => toggleDropdown(e)}
			class:fake-focus={ddActive}
		>
			<div class="flex">
				<div style="background: {value};" class="border-none rounded w-6 h-6 text-xs" />
				<div
					class="w-0 h-0 border-x-4 border-red-500 relative top-2"
					class:top
					style="margin-right: .2rem;"
				/>
			</div>
		</button>
	</div>

	{#if ddActive}
		<div
			class:top
			bind:clientHeight={ddHeight}
			class="p-4 absolute z-10 top-10 bg-white border border-gray-500 rounded"
			use:clickOutside
			on:clickoutside={clickOutsideDropdown}
		>
			<div class=" grid grid-cols-7 grid-rows-2 gap-2 values-dropdown-grid">
				{#each values as val, index}
					{#each val as innerValue, innerIndex}
						<button
							id="{id}-{index}-{innerIndex}"
							class:active={innerValue == value}
							on:keydown={(e) => keyboardGridNav(e, innerIndex)}
							style="background: {innerValue};"
							on:click={() => {
								changeValue(innerValue);
							}}
							class="border-none rounded w-6 h-6 text-xs"
						/>
					{/each}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.active {
		@apply shadow-inner;
	}
</style>
