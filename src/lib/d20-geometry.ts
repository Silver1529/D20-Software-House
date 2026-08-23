import { BufferAttribute, BufferGeometry, Quaternion, Vector3 } from 'three'

export const FACE_COUNT = 20
export const ATLAS_COLS = 5
export const ATLAS_ROWS = 4
export const TRIANGLE_FIT = 0.94
const CAMERA_AXIS = new Vector3(0, 0, 1)

export type D20Face = {
  index: number
  value: number
  vertices: [Vector3, Vector3, Vector3]
  normal: Vector3
  centroid: Vector3
  toCamera: Quaternion
  footprint: [number, number][]
  atlasCol: number
  atlasRow: number
}

export type D20Model = {
  faces: D20Face[]
  geometry: BufferGeometry
  byValue: Map<number, D20Face>
}

const PHI = (1 + Math.sqrt(5)) / 2

function icosahedronVertices(): Vector3[] {
  const raw: [number, number, number][] = []
  for (const a of [-1, 1]) {
    for (const b of [-PHI, PHI]) {
      raw.push([0, a, b], [a, b, 0], [b, 0, a])
    }
  }
  return raw.map(([x, y, z]) => new Vector3(x, y, z).normalize())
}

function triangleFaces(vertices: Vector3[]): [number, number, number][] {
  let shortest = Infinity
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      const d = vertices[i].distanceToSquared(vertices[j])
      if (d < shortest) shortest = d
    }
  }
  const tolerance = shortest * 0.02
  const isEdge = (i: number, j: number) =>
    Math.abs(vertices[i].distanceToSquared(vertices[j]) - shortest) < tolerance

  const faces: [number, number, number][] = []
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      if (!isEdge(i, j)) continue
      for (let k = j + 1; k < vertices.length; k += 1) {
        if (isEdge(i, k) && isEdge(j, k)) faces.push([i, j, k])
      }
    }
  }
  if (faces.length !== FACE_COUNT) {
    throw new Error(`d20: expected ${FACE_COUNT} faces, derived ${faces.length}`)
  }
  return faces
}

function orientOutward(
  vertices: Vector3[],
  face: [number, number, number],
): [number, number, number] {
  const [a, b, c] = face
  const normal = new Vector3()
    .subVectors(vertices[b], vertices[a])
    .cross(new Vector3().subVectors(vertices[c], vertices[a]))
  const centroid = new Vector3()
    .add(vertices[a])
    .add(vertices[b])
    .add(vertices[c])
    .divideScalar(3)
  return normal.dot(centroid) < 0 ? [a, c, b] : face
}

function assignDiceValues(centroids: Vector3[]): number[] {
  const values = new Array<number>(centroids.length).fill(0)
  const order = centroids
    .map((c, index) => ({ index, key: c.y * 1000 + c.x * 10 + c.z }))
    .sort((l, r) => r.key - l.key)
    .map((entry) => entry.index)

  let next = 1
  for (const index of order) {
    if (values[index] !== 0) continue
    let opposite = -1
    let best = Infinity
    for (let other = 0; other < centroids.length; other += 1) {
      if (other === index) continue
      const distance = centroids[index].distanceToSquared(
        centroids[other].clone().negate(),
      )
      if (distance < best) {
        best = distance
        opposite = other
      }
    }
    if (opposite < 0 || values[opposite] !== 0) {
      throw new Error('d20: antipodal face pairing failed')
    }
    values[index] = next
    values[opposite] = FACE_COUNT + 1 - next
    next += 1
  }
  return values
}

function planarFootprint(
  face: [Vector3, Vector3, Vector3],
  toCamera: Quaternion,
): [number, number][] {
  const flattened = face.map((vertex) => vertex.clone().applyQuaternion(toCamera))
  const cx = (flattened[0].x + flattened[1].x + flattened[2].x) / 3
  const cy = (flattened[0].y + flattened[1].y + flattened[2].y) / 3
  const radius = Math.max(
    ...flattened.map((p) => Math.hypot(p.x - cx, p.y - cy)),
  )
  return flattened.map((p) => [(p.x - cx) / radius, (p.y - cy) / radius]) as [
    number,
    number,
  ][]
}

export function buildD20(radius = 1): D20Model {
  const unit = icosahedronVertices()
  const rawFaces = triangleFaces(unit).map((face) => orientOutward(unit, face))

  const centroids = rawFaces.map(([a, b, c]) =>
    new Vector3().add(unit[a]).add(unit[b]).add(unit[c]).divideScalar(3),
  )
  const values = assignDiceValues(centroids)

  const valueToCell = new Map<number, { col: number; row: number }>()
  for (let value = 1; value <= FACE_COUNT; value += 1) {
    const slot = value - 1
    valueToCell.set(value, {
      col: slot % ATLAS_COLS,
      row: Math.floor(slot / ATLAS_COLS),
    })
  }

  const positions = new Float32Array(FACE_COUNT * 9)
  const normals = new Float32Array(FACE_COUNT * 9)
  const uvs = new Float32Array(FACE_COUNT * 6)
  const faces: D20Face[] = []

  rawFaces.forEach((face, index) => {
    const corners = face.map((i) => unit[i].clone().multiplyScalar(radius)) as [
      Vector3,
      Vector3,
      Vector3,
    ]
    const normal = new Vector3()
      .subVectors(corners[1], corners[0])
      .cross(new Vector3().subVectors(corners[2], corners[0]))
      .normalize()
    const toCamera = new Quaternion().setFromUnitVectors(normal, CAMERA_AXIS)
    const value = values[index]
    const cell = valueToCell.get(value)!
    const footprint = planarFootprint(corners, toCamera)

    corners.forEach((corner, corner_i) => {
      const p = index * 9 + corner_i * 3
      positions[p] = corner.x
      positions[p + 1] = corner.y
      positions[p + 2] = corner.z
      normals[p] = normal.x
      normals[p + 1] = normal.y
      normals[p + 2] = normal.z

      const [ux, uy] = footprint[corner_i]
      const t = index * 6 + corner_i * 2
      uvs[t] = (cell.col + 0.5 + ux * 0.5 * TRIANGLE_FIT) / ATLAS_COLS
      uvs[t + 1] =
        1 - (cell.row + 0.5 - uy * 0.5 * TRIANGLE_FIT) / ATLAS_ROWS
    })

    faces.push({
      index,
      value,
      vertices: corners,
      normal,
      centroid: centroids[index].clone().multiplyScalar(radius),
      toCamera,
      footprint,
      atlasCol: cell.col,
      atlasRow: cell.row,
    })
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.computeBoundingSphere()

  const byValue = new Map(faces.map((face) => [face.value, face]))
  if (!byValue.has(FACE_COUNT)) {
    throw new Error('d20: face 20 missing from model')
  }

  return { faces, geometry, byValue }
}

export function orientationForValue(model: D20Model, value: number): Quaternion {
  const face = model.byValue.get(value)
  if (!face) throw new Error(`d20: no face for value ${value}`)
  return face.toCamera.clone()
}

export function buildEdgeGeometry(model: D20Model): BufferGeometry {
  const key = (v: Vector3) =>
    `${v.x.toFixed(5)}|${v.y.toFixed(5)}|${v.z.toFixed(5)}`
  const seen = new Set<string>()
  const points: number[] = []

  for (const face of model.faces) {
    for (let i = 0; i < 3; i += 1) {
      const a = face.vertices[i]
      const b = face.vertices[(i + 1) % 3]
      const ka = key(a)
      const kb = key(b)
      const id = ka < kb ? `${ka}>${kb}` : `${kb}>${ka}`
      if (seen.has(id)) continue
      seen.add(id)
      points.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(points), 3))
  return geometry
}
