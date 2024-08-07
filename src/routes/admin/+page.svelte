<script lang="ts">
	import { AppWindow, LayoutDashboard, LogOut, UserPlus } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { ActionData, PageData } from './$types';
	import type { DeleteDetail } from '$lib/types';
	import type { User } from '@prisma/client';
	import { capitalizeFirstLetter, cn, sortFun, type SortOption } from '$lib/utils';
	import { PageContainer, PageContent } from '$lib/components/page';
	import { MoreVertical, Trash2 } from 'lucide-svelte';
	import { SortArrow, SortDropdown, setSortState } from '$lib/components/sort';
	import { superForm, type FormResult } from 'sveltekit-superforms/client';
	import { trpc } from '$lib/trpc/client';
	import { invalidateAll } from '$app/navigation';
	import { SearchInput, createSearchStore, searchHandler } from '$lib/components/search';
	import dayjs from '$lib/utils/dayjs';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { DEFAULT_SORT_OPTIONS } from '$lib/constant';
	import { mediaQuery } from 'svelte-legos';
	import { onError } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	$: ({ users, user } = data);

	let open = false;

	let isDeleteModalOpen = false;
	let deleteDetail: DeleteDetail = { type: null };

	type UserWithoutPassword = Omit<User, 'password'>;

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<UserWithoutPassword>[])];

	const sort = setSortState<Omit<UserWithoutPassword, 'password'>>(sortOptions[0]);

	const isDesktop = mediaQuery('(min-width: 768px)');

	const { form, message, errors, enhance } = superForm(data.form, {
		onResult(event) {
			const result = event.result as FormResult<ActionData>;

			switch (result.type) {
				case 'success':
					open = false;
					toast.success('User added successfully');

					invalidateAll();
					break;

				case 'error':
					toast.error('Unable to add user');
					break;
			}
		}
	});

	async function deleteUser(id: string, name: string) {
		try {
			await trpc().users.delete.mutate(id);

			users = users.filter((user) => user.id !== id);

			toast.success(`User [${name}] deleted successfully`);
		} catch (error) {
			onError(error);
		}
	}
	async function handleDelete() {
		if (deleteDetail.type !== 'user') return;

		await deleteUser(deleteDetail.id, deleteDetail.name);

		isDeleteModalOpen = false;
	}

	function clickHead(head: string) {
		const field = head as keyof UserWithoutPassword;
		const order = $sort.order === 'asc' ? 'desc' : 'asc';
		$sort = { ...$sort, field, order };
	}

	function removeSearchTerms(data: typeof searchUsers) {
		return data.map(({ searchTerms, ...rest }) => ({ ...rest }));
	}

	const searchUsers = data.users.map((user) => ({
		...user,
		searchTerms: `${user.name} ${user.email} ${user.role}`
	}));
	const searchStore = createSearchStore(searchUsers);

	const unsubscribe = searchStore.subscribe((model) => searchHandler(model));

	onDestroy(() => {
		unsubscribe();
	});

	$: $sort, ($searchStore.filtered = $searchStore.data.sort(sortFun($sort.field, $sort.order)));
</script>

<svelte:head>
	<title>Admin - Stackbold</title>
</svelte:head>

<PageContainer>
	<PageContent class="relative ">
		<div class="w-full flex items-center justify-between">
			<LayoutDashboard class="icon-lg" />
			<h1 class="font-semibold text-3xl">Admin Dashboard</h1>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="secondary" class="icon-lg p-0.5 rounded-sm">
						<img
							src={`https://api.dicebear.com/7.x/shapes/svg?seed=${user.name}`}
							class="icon-lg object-contain rounded-md"
							alt="avatar"
						/>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item href="/" class="space-x-2">
						<AppWindow class="icon-xs" />
						<span> App </span>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />

					<form method="post" action="/?/logout" use:enhance>
						<Button
							variant="ghost"
							type="submit"
							class="w-full h-8 flex justify-start items-center space-x-2 py-1.5 px-2 text-sm rounded-sm"
						>
							<LogOut class="icon-xs" />
							<span>Log out</span>
						</Button>
					</form>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		{#if $isDesktop}
			<div class="flex justify-between space-x-2">
				<SearchInput placeholder="Find User" bind:value={$searchStore.search} />

				<SortDropdown {sortOptions} bind:currentSort={$sort} />
				<Button on:click={() => (open = true)}>New user</Button>
			</div>
		{:else}
			<SearchInput placeholder="Find User" bind:value={$searchStore.search} />

			<div class="flex justify-between items-center">
				<div>{users.length} Users</div>
				<SortDropdown {sortOptions} bind:currentSort={$sort} />
			</div>
		{/if}

		<div class=" overflow-x-auto">
			<table class="w-full table-auto">
				<thead>
					<tr class="text-sm text-muted-foreground">
						{#each Object.keys(users[0]) as item}
							<th
								scope="col"
								class="text-left text-nowrap rounded-t-md hover:bg-muted/90 py-2 px-1 cursor-pointer"
							>
								<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
								<div class="flex justify-between items-center" on:click={() => clickHead(item)}>
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
					{#each removeSearchTerms($searchStore.filtered) as user (user.id)}
						<tr
							class={cn(
								'text-nowrap font-medium text-base border-y border-secondary hover:bg-muted',
								data.user.email === user.email && 'border-l-2 border-y-0  border-primary'
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
										'w-fit p-1 rounded-sm hover:text-primary cursor-pointer'
									)}
								>
									<Trash2 class="icon-sm" />
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
		{#if !$isDesktop}
			<Button
				on:click={() => (open = true)}
				class="fixed bottom-4 right-4 z-10 h-12 w-12 rounded-full"
			>
				<UserPlus />
			</Button>
		{/if}
	</PageContent>
</PageContainer>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title class="text-center">New user</Dialog.Title>
		</Dialog.Header>

		{#if $message}
			<div class="form-error-msg">
				{$message}
			</div>
		{/if}
		<form method="post" use:enhance class="space-y-4">
			<div>
				<label for="name" class="label"> Name </label>
				<input
					id="name"
					type="text"
					name="name"
					required
					bind:value={$form.name}
					class="input input-ghost"
				/>

				{#if $errors.name}
					<span class="text-error"> {$errors.name} </span>
				{/if}
			</div>

			<div>
				<label for="email" class="label"> Email </label>
				<input
					id="email"
					type="text"
					name="email"
					required
					bind:value={$form.email}
					class="input input-ghost"
				/>

				{#if $errors.email}
					<span class="text-error"> {$errors.email} </span>
				{/if}
			</div>

			<div>
				<label for="password" class="label"> Password </label>
				<input
					id="password"
					type="text"
					name="password"
					required
					bind:value={$form.password}
					class="input input-ghost"
				/>

				{#if $errors.password}
					<span class="text-error"> {$errors.password} </span>
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
