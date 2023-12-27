<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { MoreVertical, Users } from 'lucide-svelte';
	import { SortArrow, SortDropdown, setSortState, sortOptions } from '$lib/components/sort';
	import { SearchInput } from '$lib/components/search';
	import { capitalizeFirstLetter, sortFun } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import dayjs from '$lib/utils/dayjs';
	import debounce from 'debounce';
	import { superForm, type FormResult } from 'sveltekit-superforms/client';
	import { fade } from 'svelte/transition';

	export let data: PageData;
	$: ({ users } = data);

	let open = false;

	const sort = setSortState(sortOptions[0]);

	const { form, message, errors, enhance } = superForm(data.form, {
		onResult(event) {
			const result = event.result as FormResult<ActionData>;
			if (result.type == 'success') open = false;
		}
	});

	const DEBOUNCE_INTERVAL = 500;
	const debounceSearch = debounce((query: string) => {
		sortedUsers = sortedUsers.filter(({ name, email }) => {
			return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
		});
	}, DEBOUNCE_INTERVAL);

	function handleOnInputSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;

		if (value.length > 2) debounceSearch(value);
		else sortedUsers = users.sort(sortFun($sort.field, $sort.order));
	}

	$: sortedUsers = users.sort(sortFun($sort.field, $sort.order));
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
					<SearchInput placeholder="Find User" on:input={handleOnInputSearch} />
				</div>
				<div class="flex justify-between items-center space-x-2">
					<Button size="sm" class="rounded font-semibold" on:click={() => (open = true)}
						>New user</Button
					>
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
					{#each sortedUsers as user (user.id)}
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
											<DropdownMenu.Item>Change role</DropdownMenu.Item>
											<DropdownMenu.Item>Disable account</DropdownMenu.Item>
											<DropdownMenu.Item>Delete account</DropdownMenu.Item>
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan={Object.keys(users[0]).length}>
								<div class="text-center text-lg" in:fade>No users found.</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title class="text-center">New user</Dialog.Title>
		</Dialog.Header>

		{#if $message}
			<div
				class="px-1 py-4 rounded-sm text-center text-red-200 outline outline-1 outline-red-300 bg-red-700/90"
			>
				{$message}
			</div>
		{/if}
		<form method="post" use:enhance class="space-y-4">
			<div>
				<label for="name" class="px-0"> Name </label>
				<input
					id="name"
					type="text"
					name="name"
					required
					bind:value={$form.name}
					class="w-full h-9 input input-sm input-ghost bg-gray-200 outline outline-gray-50"
				/>

				{#if $errors.name}
					<span class="mt-2 text-error"> {$errors.name} </span>
				{/if}
			</div>

			<div>
				<label for="email" class=" px-0"> Email </label>
				<input
					id="email"
					type="text"
					name="email"
					required
					bind:value={$form.email}
					class="w-full h-9 input input-sm input-ghost bg-gray-200 outline outline-gray-50"
				/>

				{#if $errors.email}
					<span class="mt-2 text-error"> {$errors.email} </span>
				{/if}
			</div>

			<div>
				<label for="password" class=" px-0"> Password </label>
				<input
					id="password"
					type="text"
					name="password"
					required
					bind:value={$form.password}
					class="w-full h-9 input input-sm input-ghost bg-gray-200 outline outline-gray-50"
				/>

				{#if $errors.password}
					<span class="mt-2 text-error"> {$errors.password} </span>
				{/if}
			</div>

			<div>
				<h3>Role</h3>

				<label>
					<input id="role" type="radio" name="role" value="MEMBER" bind:group={$form.role} />
					Member
				</label>

				<label>
					<input id="role" type="radio" name="role" value="ADMIN" bind:group={$form.role} />
					Admin
				</label>
			</div>

			<div>
				<Button type="submit" class="w-full">Create</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
