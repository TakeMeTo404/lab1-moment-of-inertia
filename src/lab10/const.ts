import type { Range } from '../lib/range-util'
import { range } from '../lib/range-util'

export const pxPerMeter = 1000
export const sceneHeight = .55 /* meters */
export const sceneHeightPx = sceneHeight * pxPerMeter

export const ranges = (function createRanges() {
    // сантиметры
    const R = range(6, 10) 
    const S1 = range(10, 20)
    const S2 = range(10, 20)

    return {
        physical: {
            m: range(5, 20) /* граммы */,
            M: range(50, 100) /* граммы */,
            R,
            S1,
            S2,
        } as const,
        px: {
            loadSize: range(20, 40),
            pulleyRadius: range(R.min / 100 * pxPerMeter, R.max / 100 * pxPerMeter),
            overloadSize: range(10, 20),
            S1: range(S1.min / 100 * pxPerMeter, S1.max / 100 * pxPerMeter),
            S2: range(S2.min / 100 * pxPerMeter, S2.max / 100 * pxPerMeter),
        } as const
    } as const
})()


// TODO: change them
export const variantToI: Record<number, number> = {
    1: 0.076,
    2: 0.289,
    3: 0.128,
    4: 0.167,
    5: 0.152,
    6: 0.239,
    7: 0.118,
    8: 0.050,
    9: 0.276,
    10: 0.110,
    11: 0.227,
    12: 0.209,
    13: 0.064,
    14: 0.163,
    15: 0.276,
    16: 0.134,
    17: 0.064,
    18: 0.190,
    19: 0.125,
    20: 0.051,
    21: 0.059,
    22: 0.258,
    23: 0.275,
    24: 0.064,
    25: 0.164,
    26: 0.277,
    27: 0.223,
    28: 0.249,
    29: 0.284,
    30: 0.091
}

export const variantRange: Range = range(1, 30)