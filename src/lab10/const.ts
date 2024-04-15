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
    // todo
    // const R = range(6, 10)
    // const S1 = range(0, 20)
    // const S2 = range(0, 20)

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
	1: 0.00015,
	2: 0.00012,
	3: 0.00011,
	4: 0.00010,
	5: 0.00012,
	6: 0.00016,
	7: 0.00018,
	8: 0.00011,
	9: 0.00018,
	10: 0.00009,
	11: 0.00009,
	12: 0.00019,
	13: 0.00012,
	14: 0.00016,
	15: 0.00018,
	16: 0.00010,
	17: 0.00026,
	18: 0.00014,
	19: 0.00032,
	20: 0.00015,
	21: 0.00010,
	22: 0.00012,
	23: 0.00010,
	24: 0.00021,
	25: 0.00014,
	26: 0.00016,
	27: 0.00013,
	28: 0.00084,
	29: 0.00036,
	30: 0.00034,
}


export const variantRange: Range = range(1, 30)
