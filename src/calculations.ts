import { mRange, tRange, n2Range } from './const'

const tRand = Math.random()
const n2Rand = Math.random()

export const generateT = (m: number, d: number, n1: number) => {
    let fr = (m - mRange[0]) / (mRange[1] - mRange[0])
    const center = tRange[0] + (tRange[1] - tRange[0]) * fr
    let minRandomT = Math.max(center - .5, tRange[0])
    let maxRandomT = Math.min(center + .5, tRange[1])

    return minRandomT + (maxRandomT - minRandomT) * tRand
}
export const generateN2 = (m: number, d: number, n1: number) => {
    return n2Range[0] + (n2Range[1] - n2Range[0]) * n2Rand
}