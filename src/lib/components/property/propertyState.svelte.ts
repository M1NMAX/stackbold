import { Aggregator, Color, View, type Property, type PropertyType } from '@prisma/client';
import { onError } from '$lib/components/ui/sonner';
import { trpc } from '$lib/trpc/client';
import { capitalizeFirstLetter } from '$lib/utils';
import { toast } from 'svelte-sonner';
import { getContext, setContext } from 'svelte';
import type { UpdProperty } from '$lib/types';

export class PropertyState {
	properties = $state<Property[]>([]);
	collectionId = $state<string>('');

	constructor(properties: Property[], collectionId: string) {
		this.properties = properties;
		this.collectionId = collectionId;
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
	getMostRecentProperty(properties: Property[]) {
		return properties.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[
			this.properties.length - 1
		];
	}

	async addProperty(type: PropertyType) {
		const tmpId = crypto.randomUUID();
		try {
			const name = capitalizeFirstLetter(type);

			this.properties.push({
				id: tmpId,
				name: name,
				type: type,
				createdAt: new Date(),
				defaultValue: '',
				visibleInViews: [View.LIST, View.TABLE],
				aggregator: Aggregator.NONE,
				options: []
			});

			const { properties } = await trpc().collections.addProperty.mutate({
				id: this.collectionId,
				property: { name, type }
			});
			this.#updProperty(tmpId, this.getMostRecentProperty(properties));
		} catch (err) {
			onError(err);
			this.#removeProperty(tmpId);
		}
	}

	async duplicateProperty(id: string) {
		const target = this.getProperty(id);

		if (target == null) {
			onError({ msg: 'Invalid property' });
			return;
		}
		const tmpId = crypto.randomUUID();

		try {
			const { id: _, name, createdAt, ...rest } = target;

			this.properties.push({
				...rest,
				name: name + ' copy',
				id: tmpId,
				createdAt: new Date()
			});

			const { properties } = await trpc().collections.addProperty.mutate({
				id: this.collectionId,
				property: { ...rest, name: name + ' copy' }
			});

			this.#updProperty(tmpId, this.getMostRecentProperty(properties));
		} catch (err) {
			onError(err);
			this.#removeProperty(tmpId);
		}
	}

	async updProperty(property: UpdProperty) {
		const target = this.getProperty(property.id);

		if (!target) {
			onError({ msg: 'Invalid property' });
			return;
		}

		try {
			this.#updProperty(property.id, { ...target, ...property });

			await trpc().collections.updateProperty.mutate({
				id: this.collectionId,
				property
			});
		} catch (err) {
			onError(err);
			this.#updProperty(property.id, target);
		}
	}

	async deleteProperty(id: string) {
		const target = this.getProperty(id);
		if (!target) {
			onError({ msg: 'Invalid property' });
			return;
		}

		try {
			this.#removeProperty(id);
			await trpc().collections.deleteProperty.mutate({
				id: this.collectionId,
				propertyId: id
			});
		} catch (err) {
			onError(err);
			this.properties.push({ ...target });
		}
	}

	async addOptionToProperty(pid: string, value: string) {
		const target = this.getProperty(pid);
		if (!target) {
			onError({ msg: 'Invalid property' });
			return;
		}

		const tmpId = crypto.randomUUID();

		try {
			const option = {
				id: tmpId,
				color: Color.GRAY,
				value
			};

			this.#updProperty(pid, { ...target, options: [...target.options, option] });

			await trpc().collections.addPropertyOption.mutate({
				id: this.collectionId,
				property: { id: pid, option }
			});
		} catch (err) {
			onError(err);
			this.#updProperty(pid, target);
		}
	}

	async updPropertyOption(
		pid: string,
		option: {
			id: string;
			value?: string;
			color?: Color;
		}
	) {
		const target = this.getProperty(pid);
		if (!target) {
			onError({ msg: 'Invalid property' });
			return;
		}

		try {
			const options = target.options.map((opt) =>
				opt.id !== option.id ? opt : { ...opt, ...option }
			);

			this.#updProperty(pid, { ...target, options });

			await trpc().collections.updatePropertyOption.mutate({
				id: this.collectionId,
				property: { id: pid, option }
			});
		} catch (err) {
			onError(err);
			this.#updProperty(pid, target);
		}
	}

	async deletePropertyOption(pid: string, optionId: string) {
		const target = this.getProperty(pid);
		if (!target) {
			onError({ msg: 'Invalid property' });
			return;
		}

		try {
			const options = target.options.filter((opt) => opt.id !== optionId);

			this.#updProperty(pid, { ...target, options });

			await trpc().collections.deletePropertyOption.mutate({
				id: this.collectionId,
				property: { id: pid, optionId }
			});

			toast.success('Property option deleted successfully');
		} catch (err) {
			onError(err);
			this.#updProperty(pid, target);
		}
	}
}

const PROPERTY_STATE_CTX_KEY = Symbol('PROPERTY_STATE_CTX_KEY');

export function setPropertyState(properties: Property[], collectionId: string) {
	return setContext(PROPERTY_STATE_CTX_KEY, new PropertyState(properties, collectionId));
}

export function getPropertyState() {
	return getContext<ReturnType<typeof setPropertyState>>(PROPERTY_STATE_CTX_KEY);
}
