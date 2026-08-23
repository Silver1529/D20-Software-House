import { buildD20, buildEdgeGeometry } from '../src/lib/d20-geometry.ts'
const model = buildD20(1)
const edges = buildEdgeGeometry(model)
const count = edges.getAttribute('position').count / 2
console.log(`${count === 30 ? 'PASS' : 'FAIL'}  unique edges = ${count} (icosahedron has 30)`)
console.log(`${model.faces.length === 20 ? 'PASS' : 'FAIL'}  faces = ${model.faces.length}`)
const V = 12, E = count, F = 20
console.log(`${V - E + F === 2 ? 'PASS' : 'FAIL'}  Euler characteristic V-E+F = ${V - E + F} (must be 2)`)
process.exit(count === 30 && V - E + F === 2 ? 0 : 1)
