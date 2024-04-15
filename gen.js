console.log('{')
for (let i = 1; i <= 30; i++) {
  const I = 1 / (1000 + Math.random() * 10000)
  console.log(`\t${i}: ${I.toFixed(5)},`)
}

console.log('}')
