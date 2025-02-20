export const randomIntFromInterval = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1) + min);

export function sanitizeNumberInput(value: string) {
	let sanitizedValue = value.replace(/[^0-9,.]/g, '');

	if (sanitizedValue.indexOf(',') > sanitizedValue.indexOf('.')) {
		sanitizedValue = sanitizedValue.replace(/\./g, '').replace(',', '.');
	} else {
		sanitizedValue = sanitizedValue.replace(/,/g, '');
	}

	return parseFloat(sanitizedValue).toString();
}

globalThis.baseIdCounter ??= { current: 0 };

/**
 * Generates a unique ID based on a global counter.
 */
export function useId(prefix = 'sb-id') {
	globalThis.baseIdCounter.current++;
	return `${prefix}-${globalThis.baseIdCounter.current}`;
}
