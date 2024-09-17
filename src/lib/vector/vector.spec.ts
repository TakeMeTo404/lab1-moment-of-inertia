import { Vector, vec2, vec3, vec4, vec } from './vector'

describe('vector', () => {

    const randomArray = (len: number) => Array(len).fill(0).map(() => Math.random())
    const randomVector = (len: number) => new Vector(randomArray(len))

    it('vector.values', () => {
        for (let i = 1; i < 5; i++) {
            const array = randomArray(i)

            const vector = new Vector(array)

            expect(vector.values()).toEqual(array)
        }
    })

    it('vector.dot', () => {
        const dotProduct = (arr1: number[], arr2: number[]) => {
            if (arr1.length !== arr2.length) {
                throw new Error()
            }

            let result = 0
            for (let i = 0; i < arr1.length; i++) {
                result += arr1[i] * arr2[i]
            }
            return result
        }

        for (let i = 0; i < 10; i++) {
            const len = Math.floor(Math.random() * 10 + 1)

            const v1 = randomVector(len)
            const v2 = randomVector(len)

            expect(v1.dot(v2)).toEqual(
                dotProduct(v1.values(), v2.values())
            )
            expect(v2.dot(v1)).toEqual(
                dotProduct(v1.values(), v2.values())
            )
        }

        for (let i = 1; i < 10; i++) {
            const v1 = randomVector(i)
            const v2 = randomVector(i + Math.floor(Math.random() * 10 + 1))

            expect(() => v1.dot(v2)).toThrow()
        }
    })

    it('vector.operation', () => {

        for (let len = 1; len < 7; len++) {
            const arr1 = randomArray(len)
            const arr2 = randomArray(len)

            const v1 = new Vector(arr1)
            const v2 = new Vector(arr2)

            for (const func of [Math.pow, Math.atan2, (x, y) => x + y, (x, y) => x / y]) {
                const op = jest.fn(func)

                const res = v1.op(op, v2)

                expect(op).toHaveBeenCalledTimes(len)

                for (let i = 0; i < len; i++) {
                    expect(op).toHaveBeenNthCalledWith(i + 1, arr1[i], arr2[i])
                }

                expect(res.values()).toEqual(
                    arr1.map((a, i) => op(a, arr2[i]))
                )
            }
        }
    })

    it('vector.at', () => {
        const vec2 = new Vector([ 7, -10 ])

        const pairs: Array<[string, number[]]> = [
            [ 'xx', [7, 7] ],
            [ 'xy', [7, -10] ],
            [ 'xyx', [7, -10, 7] ],
            [ 'yyy', [-10,-10,-10] ],
        ]

        for (const [ cmp, values ] of pairs) {
            expect((vec2.at(cmp) as Vector).values()).toEqual(values)
        }

        expect(() => vec2.at('z')).toThrow()
        expect(() => vec2.at('w')).toThrow()

        const vec4 = new Vector([ 1, 2, 3, 4 ])

        expect(vec4.at('x')).toEqual(1)
        expect(vec4.at('y')).toEqual(2)
        expect(vec4.at('z')).toEqual(3)
        expect(vec4.at('w')).toEqual(4)
    })

    it('vec', () => {
        for (let n = 1; n < 10; n++) {
            expect(() => vec(n)()).toThrow()
            expect(() => vec(n)(Math.random())).not.toThrow()

            expect(() => vec(n)(...randomArray(n + 1))).toThrow()
            expect(() => vec(n)(...randomArray(n))).not.toThrow()
        }
    })

    it('vec2', () => {
        expect(vec2(3).values()).toEqual([ 3, 3 ])
        expect(vec2(-1, -2).values()).toEqual([ -1, -2 ])
        expect(vec2({ x: -1, y: -2 }).values()).toEqual([ -1, -2 ])
    })

    it('vec3', () => {
        expect(vec3(3).values()).toEqual([ 3, 3, 3 ])
        expect(vec3(-1, -3, -5).values()).toEqual([ -1, -3, -5 ])
        expect(vec3({ x: -1, y: -3, z: -5 }).values()).toEqual([ -1, -3, -5 ])
        expect(vec3({ xy: [ -1, -2 ], z: -3 }).values()).toEqual([ -1, -2, -3 ])
        expect(vec3({ xy: vec2(-1, -2), z: -3 }).values()).toEqual([ -1, -2, -3 ])
    })

    it('vec4', () => {
        expect(vec4(3).values()).toEqual([ 3, 3, 3, 3 ])
        expect(vec4(-1, -2, -5, -6).values()).toEqual([ -1, -2, -5, -6 ])
        expect(vec4({ x: -1, y: -3, z: -5, w: 6 }).values()).toEqual([ -1, -3, -5, 6 ])
        expect(vec4({ xyz: [ -1, -2, -3 ], w: 6 }).values()).toEqual([ -1, -2, -3, 6 ])
        expect(vec4({ xyz: vec3(-1, -2, -3), w: -3 }).values()).toEqual([ -1, -2, -3, -3 ])
    })
})