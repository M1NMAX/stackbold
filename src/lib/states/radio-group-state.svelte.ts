import { getContext, setContext } from 'svelte';

class RadioGroupState {
	value = $state('');
	hasValue = $derived.by(() => this.value !== '');
	disabled: boolean;
	onchange?: (value: string) => void;

	constructor(value: string, disabled: boolean = false, onchange?: (value: string) => void) {
		this.value = value;
		this.disabled = disabled;
		this.onchange = onchange;
	}

	setValue(value: string) {
		if (this.disabled) return;
		this.value = value;
		this.onchange?.(value);
	}

	isChecked(value: string) {
		return this.value === value;
	}

	getTabIndex(value: string) {
		if (!this.value || !this.isChecked(value)) return 0;
		return -1;
	}
}

const RADIO_GROUP_CTX_KEY = Symbol('RADIO_GROUP_CTX_KEY');

export function setRadioGroupState(
	value: string,
	disabled: boolean,
	onchange?: (value: string) => void
) {
	return setContext(RADIO_GROUP_CTX_KEY, new RadioGroupState(value, disabled, onchange));
}

export function getRadioGroupState() {
	return getContext<ReturnType<typeof setRadioGroupState>>(RADIO_GROUP_CTX_KEY);
}
