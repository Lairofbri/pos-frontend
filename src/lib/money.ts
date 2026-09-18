export const toCents = (value: number): number => Math.round(value * 100)
export const fromCents = (value: number): number => value / 100
export const sumCents = (values: number[]): number => values.reduce((sum, value) => sum + toCents(value), 0)
