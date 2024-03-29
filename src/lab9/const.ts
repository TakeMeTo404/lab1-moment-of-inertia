export const containerHeightPx = 700
export const flywheelDiameterPx = 200
export const mRange = [ .3, 1 ]
export const dRange = [ .05, .1 ]
export const n2Range = [ 20, 60 ]
export const dRangePx = [ 20, 35 ]
export const loadDiameterRangePx = [ 50, 100 ]
export const n1Range = [ 2, 4 ]
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
export const IRange = [ Math.min(...Object.values(variantToI)), Math.max(...Object.values(variantToI)) ]