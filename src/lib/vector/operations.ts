export type BinaryOperation = (a: number, b: number) => number
export type UnaryOperation = (a: number) => number

const basicBinaryOperationsSymbols = [ '+', '-', '*', '/' ] as const
export type basicBinaryOperationSymbol = typeof basicBinaryOperationsSymbols[number]
export const basicBinaryOperationsFunctions: {
    [K in basicBinaryOperationSymbol]: BinaryOperation
} = {
    '+': (a: number, b: number) => a + b,
    '-': (a: number, b: number) => a - b,
    '*': (a: number, b: number) => a * b,
    '/': (a: number, b: number) => a / b
}