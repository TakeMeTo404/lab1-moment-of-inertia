const iis = [...new Array(31)].map((_, i) => i)

const alphas = iis.map(() => Math.round(15 + 15 * Math.random()))
const betas = alphas.map(x => x * .8)

const nus = iis.map(i => {
    const a = Math.sqrt(1 - Math.cos(alphas[i] * Math.PI / 180))
    const b = Math.sqrt(1 - Math.cos(betas[i] * Math.PI / 180))

    // console.log(alphas[i] * Math.PI / 180, betas[i] * Math.PI / 180)

    return 2 * (a * b - b * b) / (a * a)
})

const toString = (arr) => {
    let res = '{\n'
    arr.forEach((x, i) => res += `\t${i}: ${x},\n`)
    return res + '}'
}

console.log('alphas')
console.log(toString(alphas))
// console.log('betas')
// console.log(toString(betas))

console.log()
console.log()
console.log()
console.log()

console.log('nus')
console.log(toString(nus))

// console.log('{')
// for (let i = 1; i <= 30; i++) {
//     const a = Math.round(15 + 15 * Math.random())
//     // console.log(`\t${i}: ${Nu.toFixed(5)},`)
//     console.log(`\t${i}: ${a},`)
// }

// console.log('}')
