export function parseNumber(value: string, neededValue: number = 1): number {
	if(typeof value === 'number') {
		return value
	}

	if(typeof value === 'string') {
		if(!isNaN(parseInt(value))) {
			return parseInt(value)
		} else {
			return neededValue
		}
	}

	throw new Error(
		`Failed to convert value "${value}" to number type`
	)
}