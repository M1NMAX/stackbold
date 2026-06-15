<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import {
		Avatar,
		Button,
		Card,
		Dialog,
		Empty,
		ExpandableSearchInput,
		Field,
		Label,
		RadioGroup,
		RadioGroupItem,
		VSelector
	} from '$lib/components/base/index.js';
	import { PageContainer } from '$lib/components/page/index.js';
	import {
		capitalizeFirstLetter,
		pluralize,
		sortFun,
		timeAgo,
		useSuperForm,
		type SortOption
	} from '$lib/utils/index.js';
	import { fullDateFormat, getToastState, ModalState } from '$lib/states/index.js';
	import { SortMenu } from '$lib/components/view/index.js';
	import { DEFAULT_SORT_OPTIONS, PAGE_ICONS } from '$lib/constant/index.js';
	import { Role } from '@prisma/client';
	import { untrack } from 'svelte';

	const { data } = $props();
	const TAB_OPTIONS = [
		{ id: 'all', label: 'All' },
		{ id: 'admin', label: 'Admin' }
	];

	const sortOptions = [...(DEFAULT_SORT_OPTIONS as SortOption<unknown>[])];
	const toastState = getToastState();
	const addUserModal = new ModalState();

	let tab = $state(TAB_OPTIONS[0].id);
	let sort = $state(sortOptions[0]);
	let search = $state('');

	const users = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';

		return data.users
			.filter((user) => {
				const term = `${user.name} ${user.email}`.toLowerCase();

				const match = term.includes(searchTerm);
				if (tab == 'all') return match;
				else return user.role === Role.ADMIN && match;
			})
			.sort(sortFun(sort.field, sort.order));
	});

	const { form, errors, enhance } = useSuperForm(
		untrack(() => data.form),
		toastState
	);
</script>

<PageContainer icon="users" title="Users" isBase>
	{#snippet topActions()}
		<Button
			theme="secondary"
			variant="icon"
			class="flex lg:hidden"
			onclick={() => addUserModal.open()}
		>
			<UserPlus />
		</Button>
	{/snippet}
	{#snippet actionsRow()}
		{@const Icon = PAGE_ICONS['users']}
		<Icon />

		<h1 class="grow text-2xl font-semibold">Users</h1>
		<Button class="hidden md:flex" onclick={() => addUserModal.open()}>
			<UserPlus />
			<span> Invite user </span>
		</Button>
	{/snippet}

	<div class="w-full flex justify-between gap-x-1 lg:gap-x-1.5">
		<VSelector value={tab} options={TAB_OPTIONS} onchange={(v) => (tab = v)}></VSelector>

		<div class="w-full flex justify-end gap-x-1 md:gap-x-1.5">
			<ExpandableSearchInput placeholder="Find user" bind:value={search} />

			<SortMenu options={sortOptions} bind:value={sort} />
		</div>
	</div>

	{#if users.length > 0}
		<div class="hidden lg:block">
			<table class="w-full">
				<thead>
					<tr class="p-1 text-sm text-muted-foreground border-b-2 border-secondary">
						<th class="t-header clickable"> User </th>
						<th class="t-header"> Collections </th>
						<th class="t-header"> Joined </th>
						<th class="t-header"> Last session </th>
						<th> --- </th>
					</tr>
				</thead>
				<tbody>
					{#each users as user (user.email)}
						<tr class="border-b-2 border-secondary hover:bg-muted/40 group">
							<td class="t-data flex items-center gap-x-3">
								{@render userDetail(user.name, user.email)}
							</td>
							<td> {user._count.collections} </td>
							<td> {fullDateFormat(user.createdAt)} </td>
							<td>
								{user.sessions.length !== 0 ? timeAgo(user.sessions[0].updatedAt) : '---'}
							</td>
							<td> <ArrowRight class="size-3.5 group-hover:size-4" /> </td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-y-2.5">
			{#each users as user (user.email)}
				<Card class="flex flex-row items-center gap-x-3">
					{@render userDetail(user.name, user.email)}
					<div class="flex flex-col justify-end text-xs text-right">
						<span class="font-semibold">
							{pluralize(user._count.collections, 'collection', 's')}
						</span>
						<span>
							{user.sessions.length !== 0 ? timeAgo(user.sessions[0].updatedAt) : ''}
						</span>
					</div>
				</Card>
			{/each}
		</div>
	{:else}
		<Empty text="No results" />
	{/if}
</PageContainer>

<Dialog bind:open={addUserModal.isOpen} title="New user">
	<div class="auth-form-container">
		<form method="post" use:enhance>
			<Field errors={$errors.name}>
				<Label for="name" name="Name" />
				<input
					id="name"
					type="text"
					name="name"
					required
					bind:value={$form.name}
					class="input ghost"
				/>
			</Field>

			<Field errors={$errors.email}>
				<Label for="email" name="Email" />
				<input
					id="email"
					type="text"
					name="email"
					required
					bind:value={$form.email}
					class="input ghost"
				/>
			</Field>
			<Field errors={$errors.password}>
				<Label for="password" name="Password" />
				<input
					id="password"
					type="password"
					name="password"
					required
					bind:value={$form.password}
					class="input ghost"
				/>
			</Field>

			<Field errors={$errors.role}>
				<Label for="role" name="Role" />

				<RadioGroup value={$form.role} onchange={(v) => ($form.role = v as Role)}>
					{#each Object.values(Role) as role (role)}
						{@const id = `role-${role}`}
						<Label for={id} compact hoverEffect>
							<span>
								{capitalizeFirstLetter(role)}
							</span>

							<RadioGroupItem {id} value={role}></RadioGroupItem>
						</Label>
					{/each}
				</RadioGroup>
			</Field>

			<Button type="submit" class="w-full">Create</Button>
		</form>
	</div>
</Dialog>

{#snippet userDetail(name: string, email: string)}
	<Avatar seed={name} />
	<div class="grow flex flex-col">
		<span class="font-semibold">
			{name}
		</span>
		<span class="flex items-center text-sm">
			{email}
			<BadgeCheck class="ml-1 size-4.5 fill-primary text-card" />
		</span>
	</div>
{/snippet}
