import { Vector3 } from 'three'
import { buildD20, orientationForValue, ATLAS_COLS, ATLAS_ROWS } from '../src/lib/d20-geometry.ts'

let fail = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`)
  if (!ok) fail += 1
}

const model = buildD20(1)

check('20 faces derived', model.faces.length === 20, `got ${model.faces.length}`)

const values = model.faces.map((f) => f.value).sort((a, b) => a - b)
const expected = Array.from({ length: 20 }, (_, i) => i + 1)
check('values are exactly 1..20', JSON.stringify(values) === JSON.stringify(expected))

let oppositeOk = true
let oppositeDetail = ''
for (const face of model.faces) {
  const anti = model.faces.find(
    (o) => o.centroid.distanceTo(face.centroid.clone().negate()) < 1e-6,
  )
  if (!anti || face.value + anti.value !== 21) {
    oppositeOk = false
    oppositeDetail = `face ${face.value} + ${anti ? anti.value : 'none'}`
    break
  }
}
check('opposite faces sum to 21 (real d20 invariant)', oppositeOk, oppositeDetail)

const normalsUnit = model.faces.every((f) => Math.abs(f.normal.length() - 1) < 1e-9)
check('all normals unit length', normalsUnit)

const outward = model.faces.every((f) => f.normal.dot(f.centroid) > 0)
check('all normals point outward', outward)

const q20 = orientationForValue(model, 20)
const n20 = model.byValue.get(20).normal.clone().applyQuaternion(q20)
const err = n20.distanceTo(new Vector3(0, 0, 1))
check('face 20 normal maps to +Z (camera)', err < 1e-9, `error ${err.toExponential(2)}`)

let allLand = true
let worst = 0
for (const face of model.faces) {
  const q = face.toCamera
  const n = face.normal.clone().applyQuaternion(q)
  const e = n.distanceTo(new Vector3(0, 0, 1))
  worst = Math.max(worst, e)
  if (e > 1e-9) allLand = false
}
check('every face quaternion lands its own normal on +Z', allLand, `worst ${worst.toExponential(2)}`)

const uv = model.geometry.getAttribute('uv')
let uvOk = true
let uvDetail = ''
for (const face of model.faces) {
  const uMin = face.atlasCol / ATLAS_COLS
  const uMax = (face.atlasCol + 1) / ATLAS_COLS
  const vMax = 1 - face.atlasRow / ATLAS_ROWS
  const vMin = 1 - (face.atlasRow + 1) / ATLAS_ROWS
  for (let c = 0; c < 3; c += 1) {
    const i = face.index * 3 + c
    const u = uv.getX(i)
    const v = uv.getY(i)
    if (u < uMin - 1e-6 || u > uMax + 1e-6 || v < vMin - 1e-6 || v > vMax + 1e-6) {
      uvOk = false
      uvDetail = `face ${face.value} corner ${c} uv=(${u.toFixed(4)},${v.toFixed(4)}) outside cell u[${uMin.toFixed(2)},${uMax.toFixed(2)}] v[${vMin.toFixed(2)},${vMax.toFixed(2)}]`
      break
    }
  }
  if (!uvOk) break
}
check('every face UV stays inside its own atlas cell', uvOk, uvDetail)

const pos = model.geometry.getAttribute('position')
const edgeLengths = []
for (const face of model.faces) {
  const p = [0, 1, 2].map((c) => new Vector3().fromBufferAttribute(pos, face.index * 3 + c))
  edgeLengths.push(p[0].distanceTo(p[1]), p[1].distanceTo(p[2]), p[2].distanceTo(p[0]))
}
const spread = Math.max(...edgeLengths) - Math.min(...edgeLengths)
check('all 60 triangle edges equal (regular icosahedron, float32 storage)', spread < 1e-6, `spread ${spread.toExponential(2)}`)
const f20 = model.byValue.get(20)
const flat = f20.vertices.map((v) => v.clone().applyQuaternion(q20))
const cy = (flat[0].y + flat[1].y + flat[2].y) / 3
const apexCount = flat.filter((p) => p.y > cy).length
check('face 20 flattens to a triangle with a clear vertical axis', apexCount === 1 || apexCount === 2, `${apexCount} corners above centroid`)

console.log(`\n${fail === 0 ? 'ALL CHECKS PASSED' : fail + ' CHECK(S) FAILED'}`)
process.exit(fail === 0 ? 0 : 1)
