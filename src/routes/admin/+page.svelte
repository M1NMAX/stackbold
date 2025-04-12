<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import UserPlus from 'lucide-svelte/icons/user-plus';
	import Trash from 'lucide-svelte/icons/trash-2';
	import { fade } from 'svelte/transition';
	import type { User } from '@prisma/client';
	import { capitalizeFirstLetter, tm, sortFun, type SortOption } from '$lib/utils';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page';
	import { SearchInput, SortArrow, SortMenu } from '$lib/components/filters';
	import { superForm } from 'sveltekit-superforms/client';
	import { trpc } from '$lib/trpc/client';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { Button, buttonVariants, Dialog } from '$lib/components/base/index.js';
	import { DEFAULT_SORT_OPTIONS } from '$lib/constant';
	import { getDeleteModalState, getToastState, ModalState } from '$lib/states/index.js';

	let { data } = $props();

	const USER_FIELDS = ['name', 'email', 'emailVerified', 'role'];

	type UserWithoutPassword = Omit<User, 'password'>;
	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<unknown>[])];
	let sort = $state(sortOptions[0]);
	const toastState = getToastState();

	let search = $state('');
	let users = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return data.users
			.filter((user) => {
				const searchableTerms = `${user.name} ${user.email} ${user.role}`;

				return searchableTerms.toLowerCase().includes(searchTerm);
			})
			.sort(sortFun(sort.field, sort.order));
	});

	const deleteModal = getDeleteModalState();

	const addUserModal = new ModalState();

	const { form, message, errors, enhance } = superForm(data.form, {
		onResult({ result }) {
			switch (result.type) {
				case 'success':
					addUserModal.close();
					toastState.success('User added successfully');

					invalidate('/admin');
					break;

				case 'error':
					toastState.error('Unable to add user');
					break;
			}
		}
	});

	async function deleteUser(id: string, name: string) {
		try {
			await trpc().users.delete.mutate(id);

			await invalidateAll();

			toastState.success(`User [${name}] deleted successfully`);
		} catch (error) {
			toastState.error();
		}
	}

	function clickHead(head: string) {
		const field = head as keyof UserWithoutPassword | string;
		const order = sort.order === 'asc' ? 'desc' : 'asc';
		// @ts-ignore
		sort = { ...sort, field, order };
	}

	function goBack() {
		history.back();
	}
</script>

<svelte:head>
	<title>Admin - Stackbold</title>
</svelte:head>

<PageContainer class="h-dvh">
	<PageHeader class="justify-between">
		<Button theme="secondary" variant="icon" onclick={() => goBack()}><ChevronLeft /></Button>

		<h1 class="md:hidden grow font-semibold text-2xl">Admin</h1>
	</PageHeader>
	<PageContent class="h-full relative">
		<h1 class="hidden md:block font-semibold text-4xl pb-2">Admin</h1>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="flex justify-between space-x-2">
			<SearchInput placeholder="Find User" bind:value={search} />

			<SortMenu options={sortOptions} bind:value={sort} />
			<Button class="hidden md:flex" onclick={() => addUserModal.open()}>New user</Button>
		</div>

		<div class=" overflow-x-auto">
			<table class="w-full table-auto">
				<thead>
					<tr class="text-sm text-muted-foreground">
						{#each USER_FIELDS as item}
							<th
								scope="col"
								class="text-left text-nowrap rounded-t-md hover:bg-muted/90 py-2 px-1 cursor-pointer"
							>
								<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
								<div class="flex justify-between items-center" onclick={() => clickHead(item)}>
									<span>{capitalizeFirstLetter(item)}</span>

									<SortArrow bind:order={sort.order} />
								</div>
							</th>
						{/each}

						<th scope="col" class="text-left" title="Row actions"> </th>
					</tr>
				</thead>
				<tbody>
					{#each users as user (user.email)}
						<tr
							class={tm(
								'text-nowrap font-medium text-base border-y border-secondary hover:bg-muted'
							)}
						>
							{#each USER_FIELDS as field}
								<td>
									{user[field as keyof UserWithoutPassword]}
								</td>
							{/each}

							<td>
								<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
								<div
									title="Delete"
									onclick={() => {
										deleteModal.open({
											type: 'user',
											id: user.id,
											name: user.name,
											fun: async () => {
												await deleteUser(user.id, user.name);
											}
										});
									}}
									class={tm(
										buttonVariants({
											theme: 'ghost',
											className: 'w-fit p-1 rounded-sm hover:text-primary cursor-pointer'
										})
									)}
								>
									<Trash />
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
		<Button
			onclick={() => addUserModal.open()}
			class="fixed md:hidden bottom-4 right-4 z-10 h-12 w-12 rounded-full"
		>
			<UserPlus />
		</Button>
	</PageContent>
</PageContainer>

<Dialog bind:open={addUserModal.isOpen} title="New user">
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
</Dialog>
