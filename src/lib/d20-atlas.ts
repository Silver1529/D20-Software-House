import { ATLAS_COLS, ATLAS_ROWS, TRIANGLE_FIT, type D20Model } from './d20-geometry'

const CELL = 256
const CRITICAL_VALUE = 20

const PALETTE = {
  plateOuter: '#0b1015',
  plateInner: '#1a222b',
  rim: '#5897d6',
  rimCritical: '#e99653',
  trace: 'rgba(88, 151, 214, 0.42)',
  numeral: '#e8f1fa',
  numeralCritical: '#ffd7ae',
  numeralShadow: 'rgba(0, 0, 0, 0.85)',
}

export type D20Atlas = {
  albedo: HTMLCanvasElement
  emissive: HTMLCanvasElement
}

function cellTriangle(footprint: [number, number][], cx: number, cy: number) {
  return footprint.map(([ux, uy]) => [
    cx + ux * 0.5 * TRIANGLE_FIT * CELL,
    cy - uy * 0.5 * TRIANGLE_FIT * CELL,
  ]) as [number, number][]
}

function tracePath(ctx: CanvasRenderingContext2D, points: [number, number][]) {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  ctx.lineTo(points[1][0], points[1][1])
  ctx.lineTo(points[2][0], points[2][1])
  ctx.closePath()
}

function drawCircuitry(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  seed: number,
) {
  const cx = (points[0][0] + points[1][0] + points[2][0]) / 3
  const cy = (points[0][1] + points[1][1] + points[2][1]) / 3
  ctx.save()
  ctx.strokeStyle = PALETTE.trace
  ctx.lineWidth = 1
  for (let i = 0; i < 3; i += 1) {
    const from = points[i]
    const mid = points[(i + 1) % 3]
    const t = 0.24 + ((seed * (i + 3)) % 7) / 22
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(from[0] + (mid[0] - from[0]) * t, from[1] + (mid[1] - from[1]) * t)
    ctx.stroke()
  }
  ctx.globalAlpha = 0.5
  for (let ring = 1; ring <= 2; ring += 1) {
    const k = ring * 0.19
    tracePath(
      ctx,
      points.map(([x, y]) => [cx + (x - cx) * (1 - k), cy + (y - cy) * (1 - k)]) as [
        number,
        number,
      ][],
    )
    ctx.stroke()
  }
  ctx.restore()
}

function drawNumeral(
  ctx: CanvasRenderingContext2D,
  label: string,
  cx: number,
  cy: number,
  fill: string,
  fontFamily: string,
  withShadow: boolean,
) {
  const size = label.length > 1 ? CELL * 0.3 : CELL * 0.36
  ctx.save()
  ctx.font = `700 ${size}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (withShadow) {
    ctx.fillStyle = PALETTE.numeralShadow
    ctx.fillText(label, cx, cy + size * 0.035)
  }
  ctx.fillStyle = fill
  ctx.fillText(label, cx, cy)
  ctx.restore()
}

function createCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = CELL * ATLAS_COLS
  canvas.height = CELL * ATLAS_ROWS
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('d20 atlas: 2d context unavailable')
  return { canvas, ctx }
}

export function buildD20Atlas(model: D20Model, fontFamily: string): D20Atlas {
  const albedo = createCanvas()
  const emissive = createCanvas()

  emissive.ctx.fillStyle = '#000000'
  emissive.ctx.fillRect(0, 0, emissive.canvas.width, emissive.canvas.height)

  for (const face of model.faces) {
    const cx = (face.atlasCol + 0.5) * CELL
    const cy = (face.atlasRow + 0.5) * CELL
    const critical = face.value === CRITICAL_VALUE
    const points = cellTriangle(face.footprint, cx, cy)
    const label = String(face.value)

    const a = albedo.ctx
    a.save()
    tracePath(a, points)
    a.clip()
    const gradient = a.createLinearGradient(cx - CELL / 2, cy - CELL / 2, cx + CELL / 2, cy + CELL / 2)
    gradient.addColorStop(0, PALETTE.plateInner)
    gradient.addColorStop(0.55, PALETTE.plateOuter)
    gradient.addColorStop(1, PALETTE.plateInner)
    a.fillStyle = gradient
    a.fillRect(cx - CELL / 2, cy - CELL / 2, CELL, CELL)
    drawCircuitry(a, points, face.value)
    a.restore()

    a.save()
    tracePath(a, points)
    a.strokeStyle = critical ? PALETTE.rimCritical : PALETTE.rim
    a.lineWidth = critical ? 5 : 3
    a.lineJoin = 'round'
    a.stroke()
    a.restore()

    drawNumeral(
      a,
      label,
      cx,
      cy,
      critical ? PALETTE.numeralCritical : PALETTE.numeral,
      fontFamily,
      true,
    )

    const e = emissive.ctx
    e.save()
    tracePath(e, points)
    e.strokeStyle = critical ? PALETTE.rimCritical : '#2f5f92'
    e.lineWidth = critical ? 6 : 2.5
    e.lineJoin = 'round'
    e.stroke()
    e.restore()

    drawNumeral(
      e,
      label,
      cx,
      cy,
      critical ? '#ffca94' : '#4d7fb4',
      fontFamily,
      false,
    )
  }

  return { albedo: albedo.canvas, emissive: emissive.canvas }
}

export async function waitForAtlasFont(fontFamily: string): Promise<void> {
  if (!('fonts' in document)) return
  const family = fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
  try {
    await Promise.all([
      document.fonts.load(`700 ${Math.round(CELL * 0.36)}px "${family}"`),
      document.fonts.load(`700 ${Math.round(CELL * 0.3)}px "${family}"`),
    ])
  } catch {
    return
  }
}
