import { Color, type PropertyType } from '@prisma/client';
import { trpc } from '$lib/trpc/client';
import { capitalizeFirstLetter, getTRPCErrorMsg } from '$lib/utils/index.js';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/states';
import type { RouterInputs } from '$lib/trpc/router';
import type { PropertyWithOptions } from '$lib/types';

export class PropertyState {
	#toastState = getToastState();
	properties = $state<PropertyWithOptions[]>([]);
	collectionId = $state('');

	constructor(properties: PropertyWithOptions[]) {
		this.properties = properties;
	}

	#updProperty(id: string, property: PropertyWithOptions) {
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
				defaultValue: null,
				aggregator: null,
				options: [],
				optionsM: [],
				order,
				collectionId,
				targetCollection: null,
				relatedProperty: null,
				intTargetProperty: null,
				extTargetProperty: null,
				calculate: null,
				format: null,
				decimals: null
			});

			const property = await trpc().properties.create.mutate({
				name,
				type,
				collectionId
			});
			this.#updProperty(tmpId, property);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.#removeProperty(tmpId);
		}
	}

	async duplicateProperty(id: string) {
		const target = this.getProperty(id);

		if (!target) {
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
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
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
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.#updProperty(property.id, target);
		}
	}

	async orderProperty(start: number, end: number) {
		if (start === end) return;
		await trpc().properties.order.mutate({ collectionId: this.collectionId, start, end });
		await this.refresh();
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
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.properties.push({ ...target });
		}
	}

	async refresh() {
		try {
			this.properties = await trpc().properties.list.query(this.collectionId);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
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
			const order = target.optionsM.length + 1;
			const date = new Date();

			const option = {
				id: tmpId,
				value,
				order,
				color: Color.GRAY,
				propertyId: pid,
				createdAt: date,
				updatedAt: date
			};

			this.#updProperty(pid, { ...target, optionsM: [...target.optionsM, option] });
			await trpc().properties.addOption.mutate({ propertyId: pid, value });
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.#updProperty(pid, target);
		}
	}

	async updPropertyOption(pid: string, option: RouterInputs['properties']['updateOption']) {
		const target = this.getProperty(pid);
		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		try {
			const optionsM = target.optionsM.map((opt) =>
				opt.id !== option.id ? opt : { ...opt, ...option }
			);

			this.#updProperty(pid, { ...target, optionsM });

			await trpc().properties.updateOption.mutate(option);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.#updProperty(pid, target);
		}
	}
	async orderPropertyOption(propertyId: string, start: number, end: number) {
		if (start === end) return;
		await trpc().properties.orderOption.mutate({ propertyId, start, end });
		await this.refresh();
	}

	async removeOptionFromProperty(pid: string, oid: string) {
		const target = this.getProperty(pid);
		if (!target) {
			this.#toastState.error('Invalid property');
			return;
		}

		try {
			const optionsM = target.optionsM.filter((opt) => opt.id !== oid);

			this.#updProperty(pid, { ...target, optionsM });

			await trpc().properties.removeOption.mutate(oid);
		} catch (error) {
			this.#toastState.error(getTRPCErrorMsg(error));
			this.#updProperty(pid, target);
		}
	}
}

const PROPERTY_STATE_CTX_KEY = Symbol('PROPERTY_STATE_CTX_KEY');

export function setPropertyState(properties: PropertyWithOptions[]) {
	return setContext(PROPERTY_STATE_CTX_KEY, new PropertyState(properties));
}

export function getPropertyState() {
	return getContext<ReturnType<typeof setPropertyState>>(PROPERTY_STATE_CTX_KEY);
}
