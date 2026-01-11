globalThis.baseIdCounter ??= { current: 0 };

/**
 * Generates a unique ID based on a global counter.
 */
export function useId(prefix = 'sb-id') {
	globalThis.baseIdCounter.current++;
	return `${prefix}-${globalThis.baseIdCounter.current}`;
}

export function randomIntFromInterval(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function sanitizeNumbericInput(el: HTMLInputElement) {
	const current = el.value;
	const sanitized = sanitizeNumber(current);
	if (sanitized === current) return current;

	const diff = sanitized.length - current.length;
	const calculatedCursorPosition = Math.max(0, (el.selectionStart ?? 0) + diff);

	el.value = sanitized;
	el.setSelectionRange(calculatedCursorPosition, calculatedCursorPosition);

	return sanitized;
}

export function sanitizeNumber(value: string) {
	let sanitizedValue = value.replace(/[^0-9,.]/g, '');

	if (sanitizedValue.indexOf(',') > sanitizedValue.indexOf('.')) {
		sanitizedValue = sanitizedValue.replace(/\./g, '').replace(',', '.');
	} else {
		sanitizedValue = sanitizedValue.replace(/,/g, '');
	}

	return parseFloat(sanitizedValue).toString();
}
