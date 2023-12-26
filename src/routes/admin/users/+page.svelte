<script lang="ts">
	import type { PageData } from './$types';
	import { MoreVertical, Users } from 'lucide-svelte';
	import { SortArrow, SortDropdown, setSortState, sortOptions } from '$lib/components/sort';
	import { SearchInput } from '$lib/components/search';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import dayjs from '$lib/utils/dayjs';

	export let data: PageData;
	$: ({ users } = data);

	const sort = setSortState(sortOptions[0]);
</script>

<svelte:head><title>Users - Admin - Stackbold</title></svelte:head>

<div class="grow rounded-md bg-card text-secondary-foreground overflow-hidden">
	<div class="h-full w-full mx-auto p-2 lg:p-8 space-y-2 overflow-y-auto">
		<div class="flex items-center space-x-2">
			<Users class="icon-lg" />
			<h1 class="font-semibold text-3xl">Users</h1>
		</div>

		<div class=" space-y-2">
			<div class="flex justify-between space-x-2">
				<div class="w-1/3 flex justify-between items-center space-x-2">
					<SearchInput placeholder="Find User" />
				</div>
				<div class="flex justify-between items-center space-x-2">
					<Button size="sm" class="rounded font-semibold">New user</Button>
					<SortDropdown {sortOptions} bind:currentSort={$sort} />
				</div>
			</div>

			<table class="w-full">
				<thead>
					<tr class="text-sm text-muted-foreground">
						{#each Object.keys(users[0]) as item}
							<th
								scope="col"
								class="text-left rounded-t-md hover:bg-muted/90 py-2 px-1 cursor-pointer"
							>
								<div class="flex justify-between items-center">
									<span>{capitalizeFirstLetter(item)}</span>

									<SortArrow bind:order={$sort.order} />
								</div>
							</th>
						{/each}

						<th scope="col" class="text-left" title="Row actions">
							<MoreVertical class="icon-xs" />
						</th>
					</tr>
				</thead>
				<tbody>
					{#each users as user (user.id)}
						<tr class="font-medium text-base border-y border-secondary hover:bg-opacity-20">
							{#each Object.values(user) as value}
								<td>
									{#if typeof value !== 'string' && typeof value !== 'boolean'}
										{dayjs(value).fromNow()}
									{:else}
										{value}
									{/if}
								</td>
							{/each}

							<td>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger asChild let:builder>
										<Button builders={[builder]} variant="ghost" size="xs">
											<MoreVertical class="icon-xs" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content>
										<DropdownMenu.Group>
											<DropdownMenu.Item>Disable account</DropdownMenu.Item>
											<DropdownMenu.Item>Delete account</DropdownMenu.Item>
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
