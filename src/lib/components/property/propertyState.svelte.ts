import { Aggregator, Color, View, type Property, type PropertyType } from '@prisma/client';
import { trpc } from '$lib/trpc/client';
import { capitalizeFirstLetter } from '$lib/utils';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/states';
import type { RouterInputs } from '$lib/trpc/router';

export class PropertyState {
	#toastState = getToastState();
	properties = $state<Property[]>([]);
	collectionId = $state('');

	constructor(properties: Property[]) {
		this.properties = properties;
	}

	#updProperty(id: string, property: Property) {
		this.properties = this.properties.map((prop) => (prop.id !== id ? prop : property));
	}

	#removeProperty(id: string) {
		this.properties = this.properties.filter((prop) => prop.id !== id);
	}

	getProperty(id: string) {
		return this.properties.find((property) => property.id === id);
	}

	async addProperty(type: PropertyType) {
		const tmpId = crypto.randomUUID();
		try {
			const name = capitalizeFirstLetter(type);
			const order = this.properties.length + 1;
			const collectionId = this.collectionId;

			this.properties.push({
				id: tmpId,
				name,
				type,
				createdAt: new Date(),
				updatedAt: new Date(),
				defaultValue: '',
				visibleInViews: [View.LIST, View.TABLE],
				aggregator: Aggregator.NONE,
				options: [],
				order,
				collectionId,
				targetCollection: null,
				relatedProperty: null,
				intTargetProperty: null,
				extTargetProperty: null,
				calculate: Aggregator.NONE
			});

			const property = await trpc().properties.create.mutate({
				name,
				type,
				collectionId
			});
			this.#updProperty(tmpId, property);
		} catch (err) {
			this.#toastState.error();
			this.#removeProperty(tmpId);
		}
	}

	async duplicateProperty(id: string) {
		const target = this.getProperty(id);

		if (target == null) {
			this.#toastState.error('Invalid property');
			return;
		}
		const tmpId = crypto.randomUUID();

		try {
			const { id: _1, createdAt: _2, updatedAt: _3, ...rest } = target;
			const name = rest.name + ' copy';

			this.properties.push({
				...rest,
				name,
				id: tmpId,
				order: this.properties.length + 1,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const property = await trpc().properties.create.mutate({
				...rest,
				relatedProperty: null,
				name
			});

			this.#updProperty(tmpId, property);
		} catch (err) {
			this.#toastState.error();
			this.#removeProperty(tmpId);
		}
	}

	async updProperty(property: RouterInputs['properties']['update']) {
		const target = this.getProperty(property.id);

		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		try {
			const updatedProperty = await trpc().properties.update.mutate({ ...property });
			this.#updProperty(property.id, { ...updatedProperty });
		} catch (err) {
			this.#toastState.error();
			this.#updProperty(property.id, target);
		}
	}

	async orderProperty(start: number, end: number) {
		if (start === end) return;
		await trpc().properties.order.mutate({ cid: this.collectionId, start, end });
		await this.refresh(this.collectionId);
	}

	async deleteProperty(id: string) {
		const target = this.getProperty(id);
		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		try {
			this.#removeProperty(id);
			await trpc().properties.delete.mutate(id);
		} catch (err) {
			this.#toastState.error();
			this.properties.push({ ...target });
		}
	}

	async refresh(id: string) {
		try {
			this.properties = await trpc().properties.list.query(id);
		} catch (err) {
			this.#toastState.error();
		}
	}

	async addOptionToProperty(pid: string, value: string) {
		const target = this.getProperty(pid);
		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		const tmpId = crypto.randomUUID();

		try {
			const option = {
				id: tmpId,
				color: Color.GRAY,
				value,
				extra: ''
			};

			this.#updProperty(pid, { ...target, options: [...target.options, option] });
			await trpc().properties.addOption.mutate({ pid, option });
		} catch (err) {
			this.#toastState.error();
			this.#updProperty(pid, target);
		}
	}

	async updPropertyOption(
		pid: string,
		option: RouterInputs['properties']['updateOption']['option']
	) {
		const target = this.getProperty(pid);
		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		try {
			const options = target.options.map((opt) =>
				opt.id !== option.id ? opt : { ...opt, ...option }
			);

			this.#updProperty(pid, { ...target, options });

			await trpc().properties.updateOption.mutate({ pid, option });
		} catch (err) {
			this.#toastState.error();
			this.#updProperty(pid, target);
		}
	}

	async removeOptionFromProperty(pid: string, optionId: string) {
		const target = this.getProperty(pid);
		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		try {
			const options = target.options.filter((opt) => opt.id !== optionId);

			this.#updProperty(pid, { ...target, options });

			await trpc().properties.removeOption.mutate({ pid, optionId });
		} catch (err) {
			this.#toastState.error('Invalid property');
			this.#updProperty(pid, target);
		}
	}
}

const PROPERTY_STATE_CTX_KEY = Symbol('PROPERTY_STATE_CTX_KEY');

export function setPropertyState(properties: Property[]) {
	return setContext(PROPERTY_STATE_CTX_KEY, new PropertyState(properties));
}

export function getPropertyState() {
	return getContext<ReturnType<typeof setPropertyState>>(PROPERTY_STATE_CTX_KEY);
}
