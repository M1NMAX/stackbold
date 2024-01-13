<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { SortOption } from '$lib/utils/sort';

	type T = $$Generic;

	export let sortOptions: SortOption<T>[];
	export let currentSort: SortOption<T>;
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button builders={[builder]} variant="secondary" size="sm" class="h-9 w-44">
			Sort by {currentSort.label}
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-44">
		<DropdownMenu.Label>Sort by</DropdownMenu.Label>
		<DropdownMenu.Separator />

		<DropdownMenu.Group>
			{#each sortOptions as option}
				<DropdownMenu.CheckboxItem
					checked={currentSort.field === option.field && currentSort.order === option.order}
					on:click={() => (currentSort = { ...option })}
				>
					{option.label}
				</DropdownMenu.CheckboxItem>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
