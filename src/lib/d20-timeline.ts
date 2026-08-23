import { clamp01, easeInQuad, easeOutExpo, easeOutQuart, lerp, progress } from './easing'

const GRAVITY = 26
const FALL_MS = 600
const RESTITUTION_1 = 0.42
const RESTITUTION_2 = 0.15
const SPIN_SPEED = 13.5
const TUMBLE_RATIO = 0.618

const secondsOf = (ms: number) => ms / 1000

export const DROP_HEIGHT = 0.5 * GRAVITY * secondsOf(FALL_MS) ** 2
const IMPACT_SPEED = GRAVITY * secondsOf(FALL_MS)

const HOP_1_SPEED = IMPACT_SPEED * RESTITUTION_1
const HOP_2_SPEED = IMPACT_SPEED * RESTITUTION_2
const HOP_1_MS = (2 * HOP_1_SPEED) / GRAVITY * 1000
const HOP_2_MS = (2 * HOP_2_SPEED) / GRAVITY * 1000

export const MARKS = {
  impact1: FALL_MS,
  impact2: FALL_MS + HOP_1_MS,
  rest: FALL_MS + HOP_1_MS + HOP_2_MS,
  settleStart: FALL_MS,
  settleEnd: FALL_MS + HOP_1_MS + HOP_2_MS,
  lockEnd: FALL_MS + HOP_1_MS + HOP_2_MS + 380,
  holdEnd: FALL_MS + HOP_1_MS + HOP_2_MS + 530,
  exitStart: FALL_MS + HOP_1_MS + HOP_2_MS + 530,
  total: FALL_MS + HOP_1_MS + HOP_2_MS + 890,
} as const

export type Shockwave = { progress: number; strength: number }

export type D20Frame = {
  height: number
  squash: number
  spinAngle: number
  tumbleAngle: number
  settle: number
  glow: number
  halo: number
  flash: number
  exit: number
  sparks: number
  shockwaves: Shockwave[]
  finished: boolean
}

function heightAt(t: number): number {
  if (t <= MARKS.impact1) {
    const s = secondsOf(t)
    return Math.max(0, DROP_HEIGHT - 0.5 * GRAVITY * s * s)
  }
  if (t <= MARKS.impact2) {
    const s = secondsOf(t - MARKS.impact1)
    return Math.max(0, HOP_1_SPEED * s - 0.5 * GRAVITY * s * s)
  }
  if (t <= MARKS.rest) {
    const s = secondsOf(t - MARKS.impact2)
    return Math.max(0, HOP_2_SPEED * s - 0.5 * GRAVITY * s * s)
  }
  return 0
}

function squashAt(t: number): number {
  const hits: [number, number][] = [
    [MARKS.impact1, 0.2],
    [MARKS.impact2, 0.085],
  ]
  let squash = 0
  for (const [at, amount] of hits) {
    if (t < at) continue
    const recover = progress(t, at, at + 190)
    squash = Math.max(squash, amount * (1 - easeOutQuart(recover)))
  }
  return squash
}

function spinAngleAt(t: number): number {
  const decayStart = MARKS.impact1
  if (t <= decayStart) return SPIN_SPEED * secondsOf(t)
  const held = SPIN_SPEED * secondsOf(decayStart)
  const span = secondsOf(MARKS.settleEnd - decayStart)
  const tau = Math.min(secondsOf(t - decayStart), span)
  return held + SPIN_SPEED * (tau - tau ** 3 / (3 * span * span))
}

function shockwavesAt(t: number): Shockwave[] {
  const waves: Shockwave[] = []
  const hits: [number, number, number][] = [
    [MARKS.impact1, 1, 520],
    [MARKS.impact2, 0.42, 380],
  ]
  for (const [at, strength, span] of hits) {
    if (t < at || t > at + span) continue
    waves.push({ progress: progress(t, at, at + span), strength })
  }
  return waves
}

export function sampleD20(t: number): D20Frame {
  const settle = easeOutExpo(progress(t, MARKS.settleStart, MARKS.settleEnd))
  const lock = easeOutQuart(progress(t, MARKS.rest, MARKS.lockEnd))
  const exit = easeInQuad(progress(t, MARKS.exitStart, MARKS.total))
  const flashWindow = progress(t, MARKS.impact1, MARKS.impact1 + 150)

  return {
    height: heightAt(t),
    squash: squashAt(t),
    spinAngle: spinAngleAt(t),
    tumbleAngle: spinAngleAt(t) * TUMBLE_RATIO,
    settle,
    glow: lerp(0.12, 1, lock) * (1 - exit * 0.35),
    halo: lerp(0.18, 1, lock),
    flash: (1 - easeOutQuart(flashWindow)) * (t >= MARKS.impact1 ? 1 : 0),
    exit,
    sparks: clamp01(progress(t, MARKS.impact1, MARKS.impact1 + 760)),
    shockwaves: shockwavesAt(t),
    finished: t >= MARKS.total,
  }
}
