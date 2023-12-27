<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { MoreVertical, Trash2, Users } from 'lucide-svelte';
	import { SortArrow, SortDropdown, setSortState, sortOptions } from '$lib/components/sort';
	import { SearchInput } from '$lib/components/search';
	import { capitalizeFirstLetter, cn, sortFun } from '$lib/utils';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import dayjs from '$lib/utils/dayjs';
	import debounce from 'debounce';
	import { superForm, type FormResult } from 'sveltekit-superforms/client';
	import { fade } from 'svelte/transition';
	import type { DeleteDetail } from '$lib/types';
	import { onError, successToast } from '$lib/components/feedback';
	import { trpc } from '$lib/trpc/client';

	export let data: PageData;
	$: ({ users } = data);

	let open = false;

	let isDeleteModalOpen = false;
	let deleteDetail: DeleteDetail = { type: null };

	const sort = setSortState(sortOptions[0]);
	const DEBOUNCE_INTERVAL = 500;
	const { form, message, errors, enhance } = superForm(data.form, {
		onResult(event) {
			const result = event.result as FormResult<ActionData>;
			if (result.type == 'success') open = false;
		}
	});

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

	async function deleteUser(id: string, name: string) {
		try {
			await trpc().users.delete.mutate(id);

			users = users.filter((user) => user.id !== id);

			successToast(`User [${name}] deleted successfully`);
		} catch (error) {
			onError(error);
		}
	}
	async function handleDelete() {
		if (deleteDetail.type !== 'user') return;

		await deleteUser(deleteDetail.id, deleteDetail.name);

		isDeleteModalOpen = false;
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
						<tr
							class={cn(
								'font-medium text-base border-y border-secondary hover:bg-opacity-20',
								data.user.email === user.email && 'bg-primary/50'
							)}
						>
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
								<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
								<div
									title="Delete"
									on:click={() => {
										deleteDetail = { type: 'user', id: user.id, name: user.email };
										isDeleteModalOpen = true;
									}}
									class={cn(
										buttonVariants({ variant: 'ghost' }),
										'w-fit p-1 rounded-sm hover:text-primary '
									)}
								>
									<Trash2 class="icon-md" />
								</div>
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

<AlertDialog.Root bind:open={isDeleteModalOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete</AlertDialog.Title>
			<AlertDialog.Description class="text-lg">
				Are you sure you want to delete this {deleteDetail.type} ?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action asChild let:builder>
				<Button builders={[builder]} variant="destructive" on:click={handleDelete}>Continue</Button>
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
