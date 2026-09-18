import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'
import {
  buildD20,
  buildEdgeGeometry,
  orientationForValue,
  type D20Model,
} from './d20-geometry'
import { buildD20Atlas } from './d20-atlas'
import type { D20Frame } from './d20-timeline'
import { easeOutQuart, lerp } from './easing'

const DIE_RADIUS = 1.35
const CAMERA_Z = 6.4
const SPARK_COUNT = 26
const SPARK_GRAVITY = 12
const SPIN_AXIS = new Vector3(0.34, 1, 0.16).normalize()
const TUMBLE_AXIS = new Vector3(1, 0.18, -0.52).normalize()
const ROLL_AXIS = new Vector3(-0.22, 0.3, 1).normalize()

export type D20Stage = {
  model: D20Model
  applyRoll: (frame: D20Frame) => void
  applyIdle: (elapsedMs: number, pointer: { x: number; y: number }) => void
  resize: () => void
  render: () => void
  dispose: () => void
}

function radialTexture(stops: [number, string][], size = 128): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('d20 stage: 2d context unavailable')
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  for (const [offset, color] of stops) gradient.addColorStop(offset, color)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function createSparks(): { geometry: BufferGeometry; velocities: Vector3[] } {
  const velocities: Vector3[] = []
  const positions = new Float32Array(SPARK_COUNT * 3)
  for (let i = 0; i < SPARK_COUNT; i += 1) {
    const angle = (i / SPARK_COUNT) * Math.PI * 2 + (i % 3) * 0.21
    const speed = 2.6 + ((i * 7) % 11) * 0.24
    const lift = 1.5 + ((i * 5) % 7) * 0.32
    velocities.push(
      new Vector3(Math.cos(angle) * speed, lift, Math.sin(angle) * speed * 0.35),
    )
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  return { geometry, velocities }
}

export function createD20Stage(
  canvas: HTMLCanvasElement,
  options: { fontFamily: string; landOn?: number; frame?: 'roll' | 'idle' },
): D20Stage {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 40)
  camera.position.set(0, 0, CAMERA_Z)

  const model = buildD20(DIE_RADIUS)
  const atlas = buildD20Atlas(model, options.fontFamily)

  const albedo = new CanvasTexture(atlas.albedo)
  albedo.colorSpace = SRGBColorSpace
  albedo.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const emissive = new CanvasTexture(atlas.emissive)
  emissive.colorSpace = SRGBColorSpace

  const dieMaterial = new MeshStandardMaterial({
    map: albedo,
    emissiveMap: emissive,
    emissive: new Color(0xffffff),
    emissiveIntensity: 0.55,
    metalness: 0.52,
    roughness: 0.31,
    transparent: true,
  })
  const die = new Mesh(model.geometry, dieMaterial)

  const edgeMaterial = new LineBasicMaterial({
    color: new Color(0x9ed2ff),
    transparent: true,
    opacity: 0.62,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const edgeGeometry = buildEdgeGeometry(model)
  const edges = new LineSegments(edgeGeometry, edgeMaterial)

  const coreMaterial = new MeshBasicMaterial({
    color: new Color(0x8fd8ff),
    transparent: true,
    opacity: 0.34,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const coreGeometry = new IcosahedronGeometry(DIE_RADIUS * 0.48, 1)
  const core = new Mesh(coreGeometry, coreMaterial)

  const dieGroup = new Group()
  dieGroup.add(die, edges, core)

  const haloMaterial = new SpriteMaterial({
    map: radialTexture([
      [0, 'rgba(180,224,255,0.95)'],
      [0.32, 'rgba(88,151,214,0.42)'],
      [1, 'rgba(88,151,214,0)'],
    ]),
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
  const halo = new Sprite(haloMaterial)
  halo.scale.setScalar(DIE_RADIUS * 6.2)

  const critMaterial = new SpriteMaterial({
    map: radialTexture([
      [0, 'rgba(255,214,168,0.95)'],
      [0.28, 'rgba(233,150,83,0.5)'],
      [1, 'rgba(233,150,83,0)'],
    ]),
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  })
  const critHalo = new Sprite(critMaterial)
  critHalo.scale.setScalar(DIE_RADIUS * 4.4)

  const flareGeometry = new PlaneGeometry(1, 1)

  const flareWideMaterial = new MeshBasicMaterial({
    map: radialTexture([
      [0, 'rgba(226,240,255,1)'],
      [0.3, 'rgba(122,182,240,0.55)'],
      [1, 'rgba(88,151,214,0)'],
    ]),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  })
  const flareWide = new Mesh(flareGeometry, flareWideMaterial)
  flareWide.position.y = -DIE_RADIUS

  const flareCoreMaterial = new MeshBasicMaterial({
    map: radialTexture([
      [0, 'rgba(255,255,255,1)'],
      [0.22, 'rgba(200,228,255,0.7)'],
      [1, 'rgba(140,190,240,0)'],
    ]),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  })
  const flareCore = new Mesh(flareGeometry, flareCoreMaterial)
  flareCore.position.y = -DIE_RADIUS

  const flareWarmMaterial = new MeshBasicMaterial({
    map: radialTexture([
      [0, 'rgba(255,226,186,1)'],
      [0.28, 'rgba(233,150,83,0.55)'],
      [1, 'rgba(233,150,83,0)'],
    ]),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  })
  const flareWarm = new Mesh(flareGeometry, flareWarmMaterial)
  flareWarm.position.y = -DIE_RADIUS

  const { geometry: sparkGeometry, velocities } = createSparks()
  const sparkMaterial = new PointsMaterial({
    size: 0.105,
    map: radialTexture(
      [
        [0, 'rgba(255,236,206,1)'],
        [0.45, 'rgba(233,150,83,0.6)'],
        [1, 'rgba(233,150,83,0)'],
      ],
      64,
    ),
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    opacity: 0,
    sizeAttenuation: true,
  })
  const sparks = new Points(sparkGeometry, sparkMaterial)
  sparks.position.y = -DIE_RADIUS

  const keyLight = new DirectionalLight(0xd8e8ff, 2.6)
  keyLight.position.set(-3.4, 4.2, 5)
  const rimLight = new DirectionalLight(0xffb27a, 1.9)
  rimLight.position.set(4.2, -1.6, -3.4)
  const fillLight = new DirectionalLight(0x6ea8e6, 0.85)
  fillLight.position.set(2.2, 1.4, 4)
  const innerLight = new PointLight(0x7fd4ff, 2.2, 6, 2)
  const ambient = new AmbientLight(0x2b3a4c, 1.15)

  scene.add(
    halo,
    critHalo,
    flareWide,
    flareWarm,
    flareCore,
    sparks,
    dieGroup,
    keyLight,
    rimLight,
    fillLight,
    innerLight,
    ambient,
  )

  const target = orientationForValue(model, options.landOn ?? 20)
  const spinQuat = new Quaternion()
  const tumbleQuat = new Quaternion()
  const rollQuat = new Quaternion()
  const composed = new Quaternion()

  let baseZ = CAMERA_Z

  const resize = () => {
    const parent = canvas.parentElement
    const width = parent?.clientWidth || canvas.clientWidth || 1
    const height = parent?.clientHeight || canvas.clientHeight || 1
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    const reach = Math.max(1, 1.06 / Math.min(1, camera.aspect))
    const framing = options.frame === 'idle' ? 0.78 : 1
    baseZ = CAMERA_Z * reach * framing
    camera.position.z = baseZ
    camera.updateProjectionMatrix()
  }

  const applyRoll = (frame: D20Frame) => {
    spinQuat.setFromAxisAngle(SPIN_AXIS, frame.spinAngle)
    tumbleQuat.setFromAxisAngle(TUMBLE_AXIS, frame.tumbleAngle)
    rollQuat.setFromAxisAngle(ROLL_AXIS, frame.rollAngle)
    composed.copy(spinQuat).multiply(tumbleQuat).multiply(rollQuat)
    dieGroup.quaternion.slerpQuaternions(composed, target, frame.settle)

    camera.position.z = baseZ * (1 + 0.2 * (1 - frame.settle) - frame.exit * 0.1)

    const grow = 1 + frame.exit * 0.9
    dieGroup.position.y = frame.height
    dieGroup.scale.set(
      (1 + frame.squash * 0.62) * grow,
      (1 - frame.squash) * grow,
      (1 + frame.squash * 0.62) * grow,
    )

    const fade = 1 - easeOutQuart(frame.exit)
    dieMaterial.opacity = fade
    dieMaterial.emissiveIntensity = lerp(0.5, 2.35, frame.glow) + frame.flash * 1.4
    edgeMaterial.opacity = (0.5 + frame.glow * 0.5) * fade
    coreMaterial.opacity = (0.22 + frame.glow * 0.5) * fade
    core.scale.setScalar(1 + frame.flash * 0.3)
    innerLight.intensity = 1.6 + frame.glow * 3.4 + frame.flash * 5

    halo.position.y = frame.height
    haloMaterial.opacity = (0.2 + frame.halo * 0.26) * (1 - frame.exit * 0.45)
    halo.scale.setScalar(DIE_RADIUS * (2.8 + frame.halo * 0.5 + frame.exit * 4.2))

    critHalo.position.y = frame.height
    critMaterial.opacity = frame.glow * 0.46 * (1 - frame.exit * 0.25)
    critHalo.scale.setScalar(DIE_RADIUS * (2.05 + frame.glow * 0.45 + frame.exit * 5.5))

    const first = frame.shockwaves[0]
    const second = frame.shockwaves[1]

    if (first) {
      const spread = easeOutQuart(first.progress)
      flareWide.scale.set(3.2 + spread * 19, 1.5 - spread * 0.95, 1)
      flareWideMaterial.opacity = (1 - first.progress) ** 2 * 0.8
      const snap = (1 - first.progress) ** 5
      flareCore.scale.set(1.6 + spread * 9, 0.5 - spread * 0.34, 1)
      flareCoreMaterial.opacity = snap * 0.95
    } else {
      flareWideMaterial.opacity = 0
      flareCoreMaterial.opacity = 0
    }

    if (second) {
      const spread = easeOutQuart(second.progress)
      flareWarm.scale.set(2.4 + spread * 9, 0.9 - spread * 0.62, 1)
      flareWarmMaterial.opacity = (1 - second.progress) ** 2 * 0.62
    } else {
      flareWarmMaterial.opacity = 0
    }

    if (frame.sparks > 0 && frame.sparks < 1) {
      const t = frame.sparks * 0.76
      const attribute = sparkGeometry.getAttribute('position') as BufferAttribute
      for (let i = 0; i < SPARK_COUNT; i += 1) {
        const v = velocities[i]
        attribute.setXYZ(
          i,
          v.x * t,
          Math.max(0, v.y * t - 0.5 * SPARK_GRAVITY * t * t),
          v.z * t,
        )
      }
      attribute.needsUpdate = true
      sparkMaterial.opacity = (1 - frame.sparks) ** 2 * 0.95
    } else {
      sparkMaterial.opacity = 0
    }
  }

  const applyIdle = (elapsedMs: number, pointer: { x: number; y: number }) => {
    const t = elapsedMs / 1000
    spinQuat.setFromAxisAngle(SPIN_AXIS, Math.sin(t * 0.36) * 0.26 + pointer.x * 0.2)
    tumbleQuat.setFromAxisAngle(
      TUMBLE_AXIS,
      Math.sin(t * 0.24 + 1.1) * 0.2 + pointer.y * 0.14,
    )
    composed.copy(spinQuat).multiply(tumbleQuat)
    dieGroup.quaternion.copy(composed).multiply(target)
    dieGroup.position.set(
      pointer.x * 0.18,
      Math.sin(t * 0.62) * 0.09 + pointer.y * -0.14,
      0,
    )
    dieGroup.scale.setScalar(1)

    const breathe = 0.5 + 0.5 * Math.sin(t * 1.05)
    dieMaterial.opacity = 1
    dieMaterial.emissiveIntensity = lerp(0.85, 1.35, breathe)
    edgeMaterial.opacity = lerp(0.42, 0.62, breathe)
    coreMaterial.opacity = lerp(0.16, 0.32, breathe)
    innerLight.intensity = lerp(1.5, 2.4, breathe)

    halo.position.copy(dieGroup.position)
    haloMaterial.opacity = lerp(0.15, 0.22, breathe)
    halo.scale.setScalar(DIE_RADIUS * 2.75)

    critHalo.position.copy(dieGroup.position)
    critMaterial.opacity = lerp(0.12, 0.2, breathe)
    critHalo.scale.setScalar(DIE_RADIUS * 2)

    flareWideMaterial.opacity = 0
    flareCoreMaterial.opacity = 0
    flareWarmMaterial.opacity = 0
    sparkMaterial.opacity = 0
  }

  const render = () => renderer.render(scene, camera)

  const dispose = () => {
    model.geometry.dispose()
    edgeGeometry.dispose()
    coreGeometry.dispose()
    flareGeometry.dispose()
    sparkGeometry.dispose()
    dieMaterial.dispose()
    edgeMaterial.dispose()
    coreMaterial.dispose()
    haloMaterial.map?.dispose()
    haloMaterial.dispose()
    critMaterial.map?.dispose()
    critMaterial.dispose()
    flareWideMaterial.map?.dispose()
    flareWideMaterial.dispose()
    flareCoreMaterial.map?.dispose()
    flareCoreMaterial.dispose()
    flareWarmMaterial.map?.dispose()
    flareWarmMaterial.dispose()
    sparkMaterial.map?.dispose()
    sparkMaterial.dispose()
    albedo.dispose()
    emissive.dispose()
    renderer.dispose()
  }

  resize()

  return { model, applyRoll, applyIdle, resize, render, dispose }
}
