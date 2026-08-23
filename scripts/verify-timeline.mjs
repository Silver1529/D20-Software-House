import { sampleD20, MARKS, DROP_HEIGHT } from '../src/lib/d20-timeline.ts'

let fail = 0
const check = (n, ok, d = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); if (!ok) fail += 1 }

console.log('MARKS (ms):')
for (const [k, v] of Object.entries(MARKS)) console.log(`  ${k.padEnd(12)} ${v.toFixed(0)}`)
console.log(`  drop height  ${DROP_HEIGHT.toFixed(3)} units\n`)

const at = (t) => sampleD20(t)

check('starts at full drop height', Math.abs(at(0).height - DROP_HEIGHT) < 1e-9, `${at(0).height.toFixed(3)}`)
check('touches down exactly at impact1', at(MARKS.impact1).height < 1e-9, `${at(MARKS.impact1).height.toExponential(1)}`)
check('touches down exactly at impact2', at(MARKS.impact2).height < 1e-9, `${at(MARKS.impact2).height.toExponential(1)}`)
check('at rest after rest mark', at(MARKS.rest + 1).height === 0)

let minH = Infinity, maxDisc = 0, prev = at(0).height
for (let t = 0; t <= MARKS.total; t += 1) {
  const h = at(t).height
  minH = Math.min(minH, h)
  maxDisc = Math.max(maxDisc, Math.abs(h - prev))
  prev = h
}
check('height never goes below the surface', minH >= 0, `min ${minH.toExponential(1)}`)
check('height is continuous (no teleport frames)', maxDisc < 0.05, `max step ${maxDisc.toFixed(4)}/ms`)

let peak1 = 0, peak2 = 0
for (let t = MARKS.impact1; t <= MARKS.impact2; t += 1) peak1 = Math.max(peak1, at(t).height)
for (let t = MARKS.impact2; t <= MARKS.rest; t += 1) peak2 = Math.max(peak2, at(t).height)
const DIE_RADIUS = 1.35
const expect1 = 0.42 ** 2 * DROP_HEIGHT
const expect2 = 0.15 ** 2 * DROP_HEIGHT
check('bounce 1 peak matches restitution physics (e1^2 h)', Math.abs(peak1 - expect1) < 0.01, `${peak1.toFixed(3)} vs ${expect1.toFixed(3)}`)
check('bounce 2 peak matches restitution physics (e2^2 h)', Math.abs(peak2 - expect2) < 0.01, `${peak2.toFixed(3)} vs ${expect2.toFixed(3)}`)
check('bounce 1 reads against the die (>40% of radius)', peak1 > DIE_RADIUS * 0.4, `${((peak1 / DIE_RADIUS) * 100).toFixed(0)}% of radius`)
check('bounce 2 is clearly smaller than bounce 1', peak2 < peak1 * 0.3)
check('die enters frame within 80ms of release', DROP_HEIGHT - DIE_RADIUS < 3.4, `bottom tip at ${(DROP_HEIGHT - DIE_RADIUS).toFixed(2)} vs visible half-height 3.18`)

check('settle blend is 0 before first impact', at(MARKS.impact1 - 1).settle === 0)
check('settle blend reaches 1 by settleEnd', at(MARKS.settleEnd).settle >= 0.999, at(MARKS.settleEnd).settle.toFixed(5))
check('orientation is locked by the time it comes to rest', at(MARKS.rest).settle >= 0.999, at(MARKS.rest).settle.toFixed(5))
check('tumble uses a non-syncing second axis', Math.abs(at(600).tumbleAngle / at(600).spinAngle - 0.618) < 1e-9)

let mono = true, p = -1
for (let t = 0; t <= MARKS.settleEnd; t += 1) { const s = at(t).settle; if (s < p - 1e-9) mono = false; p = s }
check('settle never rotates backwards', mono)

let spinMono = true; p = -1
for (let t = 0; t <= MARKS.total; t += 1) { const s = at(t).spinAngle; if (s < p - 1e-9) spinMono = false; p = s }
check('spin only ever advances', spinMono, `final ${at(MARKS.total).spinAngle.toFixed(2)} rad`)

check('squash is zero before impact', at(MARKS.impact1 - 1).squash === 0)
check('squash spikes at impact', at(MARKS.impact1).squash > 0.15, at(MARKS.impact1).squash.toFixed(3))
check('squash fully recovers', at(MARKS.impact2 + 200).squash < 0.01)

check('glow ramps to full by lockEnd', at(MARKS.lockEnd).glow > 0.95, at(MARKS.lockEnd).glow.toFixed(3))
check('exit has not started during the hold', at(MARKS.holdEnd - 1).exit === 0)
check('exit completes at total', at(MARKS.total).exit >= 0.999)
check('reports finished exactly at total', at(MARKS.total).finished && !at(MARKS.total - 1).finished)
check('total duration stays under 2.8s', MARKS.total < 2800, `${MARKS.total.toFixed(0)}ms`)

const wavesAtImpact = at(MARKS.impact1 + 10).shockwaves
check('impact emits a shockwave', wavesAtImpact.length === 1 && wavesAtImpact[0].strength === 1)
check('no shockwave lingers at the end', at(MARKS.total).shockwaves.length === 0)

console.log(`\n${fail === 0 ? 'ALL CHECKS PASSED' : fail + ' CHECK(S) FAILED'}`)
process.exit(fail === 0 ? 0 : 1)
