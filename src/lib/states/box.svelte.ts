import type { ReadableBox, WritableBox } from '$lib/types';

export function box<T>(getter: () => T): ReadableBox<T>;
export function box<T>(getter: () => T, setter: (v: T) => void): WritableBox<T>;
export function box<T>(getter: () => T, setter?: (v: T) => void) {
	const derived = $derived.by(getter);

	if (!setter) {
		return {
			get current() {
				return getter();
			}
		};
	}

	return {
		get current() {
			return derived;
		},
		set current(v: T) {
			setter(v);
		}
	};
}
