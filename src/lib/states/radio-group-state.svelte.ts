import type { ReadableBox, WritableBox } from '$lib/types';
import { getContext, setContext } from 'svelte';

interface RadioGroupStateOpts {
	value: WritableBox<string>;
	disabled: ReadableBox<boolean>;
}

class RadioGroupState {
	readonly opts: RadioGroupStateOpts;
	readonly hasValue = $derived.by(() => this.opts.value.current !== '');

	constructor(opts: RadioGroupStateOpts) {
		this.opts = opts;
	}

	setValue(value: string) {
		if (this.opts.disabled.current) return;
		this.opts.value.current = value;
	}

	isChecked(value: string) {
		return this.opts.value.current === value;
	}

	getTabIndex(value: string) {
		if (!this.opts.value || !this.isChecked(value)) return 0;
		return -1;
	}

	isDisabled() {
		return this.opts.disabled.current;
	}
}

const RADIO_GROUP_CTX_KEY = Symbol('RADIO_GROUP_CTX_KEY');

export function setRadioGroupState(opts: RadioGroupStateOpts) {
	return setContext(RADIO_GROUP_CTX_KEY, new RadioGroupState(opts));
}

export function getRadioGroupState() {
	return getContext<ReturnType<typeof setRadioGroupState>>(RADIO_GROUP_CTX_KEY);
}
