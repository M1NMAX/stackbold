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
