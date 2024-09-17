/* type ThreeNumbers = Tuple<number, 3>   ===   [number, number, number] */
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [ T, ...R ]>
type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never
export type { Tuple }

/* union to tuple (crazy) */
type Contra<T> = T extends any ? (arg: T) => void : never
// type Cov<T> = T extends any ? () => T : never

// type InferCov<T> = [T] extends [() => infer I] ? I : never
// const t20: InferCov<Cov<'a' | 'b'>> = 'a';   // 'a' | 'b'

type InferContra<T> = [T] extends [(arg: infer I) => void] ? I : never
// const t21: InferContra<Contra<'a'|'b'>> = 'a';  // Type 'string' is not assignable to type 'never'.ts(2322)
// const t22: InferContra<Contra<{ a: 'a' } | { b: 'b' }>> = { a: 'a', b: 'b' }

type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>
type Union2Tuple<T> =
    PickOne<T> extends infer U
        ? Exclude<T, U> extends never ? [T] : [...Union2Tuple<Exclude<T, U>>, U]
        : never

// const t32: Union2Tuple<'a'|'b'|'c'|'d'|'e'> = ['a', 'b', 'c', 'd', 'e']
export type { Union2Tuple }

