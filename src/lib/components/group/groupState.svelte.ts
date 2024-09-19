import type { RouterInputs } from '$lib/trpc/router';
import type { Group } from '@prisma/client';
import { onError } from '$lib/components/ui/sonner';
import { trpc } from '$lib/trpc/client';
import { toast } from 'svelte-sonner';
import { getContext, setContext } from 'svelte';

export class GroupState {
	groups = $state<Group[]>([]);

	constructor(groups: Group[]) {
		this.groups = groups;
	}

	#updGroup(id: string, group: Group) {
		this.groups = this.groups.map((g) => (g.id !== id ? g : group));
	}

	#removeGroup(id: string) {
		this.groups = this.groups.filter((group) => group.id !== id);
	}

	#getGroup(id: string) {
		return this.groups.find((group) => group.id === id) || null;
	}

	async createGroup(args: RouterInputs['groups']['create']) {
		const tmpId = crypto.randomUUID();
		try {
			this.groups.push({
				...args,
				id: tmpId.toString(),
				ownerId: tmpId.toString(),
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const result = await trpc().groups.create.mutate({ ...args });
			this.#updGroup(tmpId, result);
			toast.success('New group created successfully');
		} catch (err) {
			onError(err);
			this.#removeGroup(tmpId);
		}
	}

	async updGroup(args: RouterInputs['groups']['update']) {
		const { id, data } = args;

		let target = this.#getGroup(id);
		if (target == null) return;
		try {
			this.#updGroup(id, { ...target, ...data });
			await trpc().groups.update.mutate({ ...args });
		} catch (err) {
			onError(err);
			this.#updGroup(id, target);
		}
	}

	async deleteGroup(id: string) {
		let target = this.#getGroup(id);
		if (target == null) return;

		try {
			this.#removeGroup(id);
			await trpc().groups.delete.mutate(id);
			toast.success(`Group [${target.name}] deleted successfully`);
		} catch (err) {
			onError(err);
			this.groups.push({ ...target });
		}
	}

	async refresh() {
		try {
			const result = await trpc().groups.list.query();
			this.groups = result;
		} catch (err) {
			onError(err);
		}
	}
}

const GROUP_STATE_CTX_KEY = Symbol('GROUP_STATE_CTX_KEY');
export function setGroupState(groups: Group[]) {
	return setContext(GROUP_STATE_CTX_KEY, new GroupState(groups));
}

export function getGroupState() {
	return getContext<ReturnType<typeof setGroupState>>(GROUP_STATE_CTX_KEY);
}
