import type { RouterInputs } from '$lib/trpc/router';
import type { Group } from '@prisma/client';
import { trpc } from '$lib/trpc/client';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/states';

export class GroupState {
	#toastState = getToastState();
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

	getGroup(id: string) {
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
			this.#toastState.success('New group created successfully');
		} catch (err) {
			this.#toastState.error();
			this.#removeGroup(tmpId);
		}
	}

	async updGroup(args: RouterInputs['groups']['update']) {
		const { id, data } = args;

		let target = this.getGroup(id);
		if (target == null) {
			this.#toastState.error();
			return;
		}

		try {
			this.#updGroup(id, { ...target, ...data });
			await trpc().groups.update.mutate({ ...args });
		} catch (err) {
			this.#toastState.error();
			this.#updGroup(id, target);
		}
	}

	async deleteGroup(id: string) {
		let target = this.getGroup(id);
		if (target == null) {
			this.#toastState.error();
			return;
		}

		try {
			this.#removeGroup(id);
			await trpc().groups.delete.mutate(id);
		} catch (err) {
			this.#toastState.error();
			this.groups.push({ ...target });
		}
	}

	async refresh() {
		try {
			const result = await trpc().groups.list.query();
			this.groups = result;
		} catch (err) {
			this.#toastState.error();
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
