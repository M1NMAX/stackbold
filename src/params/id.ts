export function match(param: string) {
	return /^[0-9a-f]{24}$/.test(param);
}
