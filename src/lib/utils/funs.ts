// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function noCheck(x: any) {
	return x;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
	const result = { ...obj };
	keys.forEach((key) => delete result[key]);
	return result;
}

export function noop() {}
