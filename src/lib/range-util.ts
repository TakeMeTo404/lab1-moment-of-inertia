export type Range = {
    min: number,
    max: number
}

export const range = (min: number, max: number) => ({ min, max })
export const inRange = (range: Range) => (v: number) => v >= range.min && v <= range.max
export const mid = (range: Range) => (range.min + range.max) / 2