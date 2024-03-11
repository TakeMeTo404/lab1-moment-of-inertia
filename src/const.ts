export const containerHeightPx = 700
export const flywheelDiameterPx = 200
export const mRange = [ .3, 1 ]
export const dRange = [ .05, .1 ]
export const tRange = [ 6, 10 ]
export const n2Range = [ 30, 80 ]
export const dRangePx = [ 30, 50 ]
export const loadDiameterRangePx = [ 50, 100 ]
export const n1Range = [ 2, 4 ]
export const variantToI: Record<number, number> = {
    1: 2.559,
    2: 1.173,
    3: 1.518,
    4: 2.512,
    5: 1.722,
    6: 2.455,
    7: 0.752,
    8: 1.306,
    9: 2.090,
    10: 0.692,
    11: 1.972,
    12: 2.673,
    13: 1.399,
    14: 2.903,
    15: 0.645,
    16: 2.778,
    17: 2.070,
    18: 1.853,
    19: 1.250,
    20: 0.696,
    21: 1.997,
    22: 1.139,
    23: 1.845,
    24: 1.016,
    25: 0.965,
    26: 2.895,
    27: 1.083,
    28: 2.503,
    29: 1.210,
    30: 1.490
}
export const IRange = [ Math.min(...Object.values(variantToI)), Math.max(...Object.values(variantToI)) ]