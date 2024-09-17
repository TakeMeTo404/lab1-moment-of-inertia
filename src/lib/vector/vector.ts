import type { Tuple } from '../ts-utils'
import { basicBinaryOperationsFunctions } from './operations'
import type { basicBinaryOperationSymbol, BinaryOperation, UnaryOperation } from './operations'

const components = [ 'x', 'y', 'z', 'w' ] as const

type VecComponents<N extends 2 | 3 | 4> = {
    2: typeof components[0 | 1]
    3: typeof components[0 | 1 | 2]
    4: typeof components[0 | 1 | 2 | 3]
}[N]

type VecComponentsGetters<Components extends string> = (
    ((cmp1: `${Components}`) => number) &
    ((cmp12: `${Components}${Components}`) => Vec<2>) &
    ((cmp123: `${Components}${Components}${Components}`) => Vec<3>)
    )

/* N – dimension of the linear space. For example, Vec<2> – in space with X,Y coordinates */
export type Vec<N extends number> = {
    values: () => Tuple<number, N>
    at: N extends 2 | 3 | 4 ? VecComponentsGetters<VecComponents<N>> : never

    op: (f: basicBinaryOperationSymbol | BinaryOperation, withArg: number | Vec<N>) => Vec<N>
    apply: (f: UnaryOperation) => Vec<N>
    dot: (other: Vec<N>) => number
}

export class Vector {
    constructor(
        private readonly _values: number[]
    ) {}

    apply(f: UnaryOperation): Vector {
        return new Vector(this._values.map(f))
    }

    at(cmp: string): number | Vector {
        /* only vectors with dimension 2 | 3 | 4 can give values with components pseudonyms */
        if (![ 2, 3, 4 ].includes(this._values.length)) {
            throw new Error()
        }

        const allowed = new Array(this._values.length).fill(null).map((_, i) => components[i])

        const chars = cmp.split('') as any[]
        if (!chars.every(char => allowed.includes(char))) {
            throw new Error()
        }


        const getComponent = (char: string) => {
            switch (char) {
                case 'x':
                    return this._values[0]
                case 'y':
                    return this._values[1]
                case 'z':
                    return this._values[2]
                case 'w':
                    return this._values[3]
            }
        }

        if (chars.length === 1) {
            return getComponent(chars[0])
        }

        return new Vector(chars.map(getComponent))
    }

    dot(other: Vector): number {
        if (this._values.length !== other._values.length) {
            throw new Error()
        }

        return this._values
            .map((v, i) => v * other._values[i])
            .reduce((acc, x) => acc + x, 0)
    }

    op(f: basicBinaryOperationSymbol | BinaryOperation, withArg: number | Vector): Vector {
        if (withArg instanceof Vector && this._values.length !== withArg._values.length) {
            throw new Error()
        }

        const func = typeof f === 'function' ? f : basicBinaryOperationsFunctions[f]
        const otherValues = withArg instanceof Vector ? withArg._values : Array(this._values.length).fill(withArg)

        return new Vector(
            this._values.map((v, i) => func(v, otherValues[i]))
        )
    }

    values(): number[] {
        return [ ...this._values ]
    }
}

type VecCreateArgs<N extends number> =
    | FromRepeatedNumber
    | FromNumbersArray<N>
    | FromEveryComponent<N>
    | FromVectorOfSmallerDimension<N>

type FromRepeatedNumber = [ number ]
type FromNumbersArray<N extends number> = Tuple<number, N>
type FromEveryComponent<N extends number> = N extends 2 | 3 | 4 ? [ {
    [Component in VecComponents<N>]: number
} ] : never
type FromVectorOfSmallerDimension<N extends number> =
    N extends 3 | 4 ? [ {
        3: {
            xy: Vec<2> | Tuple<number, 2>
            z: number
        }
        4: {
            xyz: Vec<3> | Tuple<number, 3>
            w: number
        }
    }[N] ] : never

export const vec =
    <N extends number>(n: N) =>
        (...args: VecCreateArgs<N>): Vec<N> => {

            /* repeat one number 'n' times */
            if (args.length === 1 && typeof args[0] === 'number') {
                return new Vector(new Array(n).fill(args[0])) as any
            }

            if (args.length === 1 && typeof args[0] === 'object') {

                /* only vectors with dimension 2 | 3 | 4 can be created with components config */
                if (![ 2, 3, 4 ].includes(n)) {
                    throw new Error()
                }

                const nVectorComponents = new Array(n).fill(null).map((_, i) => components[i])

                const entries = Object.entries(args[0])
                const keys = Object.keys(args[0])

                /* example: vec4({ x: 1, y: 2, z: -5, w: 10 }) */
                const fromEveryComponent = nVectorComponents.length === entries.length &&
                    nVectorComponents.every(c => keys.includes(c)) &&
                    keys.every(key => typeof args[0][key] === 'number')

                if (fromEveryComponent) {
                    return new Vector(
                        nVectorComponents.map(c => args[0][c])
                    ) as any
                }

                if (n === 2) {
                    /* not allowed to create vec2 with args [{ x: Vec1, y: number }] */
                    throw new Error()
                }

                /* example: vec4({ xyz: vec3(7), w: 10 })  ->  `w` is component of new dimension   */
                const newDimensionComponent = nVectorComponents[nVectorComponents.length - 1]
                const smallerDimensionVectorComponentsConcatenated = nVectorComponents.slice(0, -1).join('')

                const fromVectorWithSmallerDimension = keys.length === 2 &&
                    keys.includes(newDimensionComponent) && keys.includes(smallerDimensionVectorComponentsConcatenated) &&
                    typeof args[0][newDimensionComponent] === 'number'

                if (fromVectorWithSmallerDimension) {
                    const newDimensionComponentValue = args[0][newDimensionComponent] as number

                    const smallerDimensionVector = args[0][smallerDimensionVectorComponentsConcatenated]

                    const smallerDimensionValues: number[] =
                        smallerDimensionVector instanceof Vector ? smallerDimensionVector.values() :
                            Array.isArray(smallerDimensionVector) ? smallerDimensionVector :
                                null

                    if (smallerDimensionValues?.length !== n - 1) {
                        throw new Error()
                    }

                    return new Vector([...smallerDimensionValues, newDimensionComponentValue]) as any
                }

                throw new Error()
            }

            /* check `n numbers are given in array */
            if (args.length === n && args.every(a => typeof a === 'number')) {
                return new Vector(args as number[]) as any
            }

            throw new Error()
        }

export const vec2 = vec(2)
export const vec3 = vec(3)
export const vec4 = vec(4)

export type Vec2 = Vec<2>
export type Vec3 = Vec<3>
export type Vec4 = Vec<4>