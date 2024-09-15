import type { RouterInputs } from '$lib/trpc/router';
import { type Group } from '@prisma/client';
import { onError } from '$lib/components/ui/sonner';
import { trpc } from '$lib/trpc/client';
import { toast } from 'svelte-sonner';

export class GroupState {
	groups = $state<Group[]>([]);

	constructor(groups: Group[]) {
		this.groups = groups;
	}

	updGroupLocal(id: string, group: Group) {
		this.groups = this.groups.map((g) => (g.id !== id ? g : group));
	}

	removeGroupLocal(id: string) {
		this.groups = this.groups.filter((group) => group.id !== id);
	}

	getGroupLocal(id: string) {
		return this.groups.find((group) => group.id === id) || null;
	}

	async createGroup(args: RouterInputs['groups']['create']) {
		const tmpId = crypto.randomUUID();
		try {
			this.groups.push({
				id: tmpId.toString(),
				ownerId: tmpId.toString(),
				name: args.name,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const result = await trpc().groups.create.mutate({ ...args });
			this.updGroupLocal(tmpId, result);
			toast.success('New group created successfully');
		} catch (err) {
			onError(err);
			this.removeGroupLocal(tmpId);
		}
	}

	async updGroup(args: RouterInputs['groups']['update']) {
		const { id, data } = args;

		let target = this.getGroupLocal(id);
		if (target == null) return;
		try {
			type ArgsKeys = keyof RouterInputs['groups']['update']['data'];
			type Groupkeys = keyof Omit<Group, 'createdAt' | 'updatedAt'>;
			for (const key in data) {
				const targetKey = key as Groupkeys;
				const inputValue = data[key as ArgsKeys];

				if (
					target.hasOwnProperty(key) &&
					inputValue != undefined &&
					target[key as Groupkeys] !== inputValue
				) {
					if (inputValue !== undefined) {
						if (typeof target[targetKey] === 'string' && typeof inputValue === 'string') {
							target[targetKey] = inputValue;
						}
					}
				}
			}

			this.updGroupLocal(id, target);
			await trpc().groups.update.mutate({ ...args });
		} catch (err) {
			onError(err);
			this.updGroupLocal(id, target);
		}
	}

	async deleteGroup(id: string) {
		let target = this.getGroupLocal(id);
		if (target == null) return;

		try {
			this.groups = this.groups.filter((group) => group.id != id);
			await trpc().groups.delete.mutate(id);
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
