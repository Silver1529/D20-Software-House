const { chromium } = require('playwright')
const URL = 'http://localhost:4317/'
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
const ALLOW = [...GL, '--autoplay-policy=no-user-gesture-required']

const tap = (p) =>
  p.addInitScript(() => {
    const w = window
    w.__t0 = performance.now()
    w.__log = []
    const Original = w.Audio
    w.Audio = function (src) {
      const el = new Original(src)
      const name = String(src).split('/').pop()
      const at = () => Math.round(performance.now() - w.__t0)
      const origPlay = el.play.bind(el)
      el.play = () => {
        w.__log.push({ ev: 'play', name, at: at() })
        return origPlay()
      }
      const origPause = el.pause.bind(el)
      el.pause = () => {
        w.__log.push({ ev: 'pause', name, at: at() })
        return origPause()
      }
      const desc =
        Object.getOwnPropertyDescriptor(Original.prototype, 'volume') ||
        Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume')
      Object.defineProperty(el, 'volume', {
        get: () => desc.get.call(el),
        set: (v) => {
          w.__log.push({ ev: 'vol', name, at: at(), v: Number(v.toFixed(3)) })
          desc.set.call(el, v)
        },
      })
      return el
    }
    w.Audio.prototype = Original.prototype
  })

const timeline = async (p) => {
  const log = await p.evaluate(() => window.__log)
  const byName = {}
  for (const e of log) {
    byName[e.name] = byName[e.name] || { play: null, pause: null, fadeSteps: 0, minVol: null }
    const r = byName[e.name]
    if (e.ev === 'play' && r.play === null) r.play = e.at
    if (e.ev === 'pause') r.pause = e.at
    if (e.ev === 'vol' && r.play !== null) {
      r.fadeSteps += 1
      r.minVol = r.minVol === null ? e.v : Math.min(r.minVol, e.v)
    }
  }
  for (const [name, r] of Object.entries(byName)) {
    const dur = r.play !== null && r.pause !== null ? r.pause - r.play : null
    console.log(
      `    ${name.padEnd(18)} play@${String(r.play).padStart(5)}ms  stop@${String(r.pause).padStart(5)}ms  audible=${String(dur).padStart(5)}ms  fadeSteps=${r.fadeSteps} minVol=${r.minVol}`,
    )
  }
  return byName
}

;(async () => {
  console.log('=== dice on ground impact, success clipped to 1.5s ===')
  const browser = await chromium.launch({ args: ALLOW })
  const p = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  p.on('pageerror', (e) => console.log('  PAGEERROR:', e.message))
  p.on('console', (m) => { if (m.type() === 'error') console.log('  CONSOLE:', m.text().slice(0, 140)) })
  await tap(p)
  await p.goto(URL, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector('.preloader', { timeout: 8000 })
  const mountedAt = await p.evaluate(() => Math.round(performance.now() - window.__t0))
  await p.waitForSelector('.preloader', { state: 'detached', timeout: 12000 })
  const goneAt = await p.evaluate(() => Math.round(performance.now() - window.__t0))
  await p.waitForTimeout(2600)
  console.log(`  preloader mounted@${mountedAt}ms  unmounted@${goneAt}ms`)
  const r = await timeline(p)

  const roll = r['dice-roll.mp3']
  const crit = r['critical-hit.mp3']
  const gap = crit && roll ? crit.play - roll.play : null
  console.log('')
  console.log(`  CHECK dice starts at impact, not at release   -> gap from preloader mount: ${roll.play - mountedAt}ms (impact is 600ms into the roll)`)
  console.log(`  CHECK success starts ~684ms after the dice    -> ${gap}ms`)
  const audible = crit.pause - crit.play
  console.log(`  CHECK success audible window ~1500ms          -> ${audible}ms ${audible >= 1350 && audible <= 1650 ? 'OK' : 'OUT OF RANGE'}`)
  console.log(`  CHECK success survives preloader unmount      -> unmount@${goneAt}ms, success stopped@${crit.pause}ms ${crit.pause > goneAt ? 'OK' : 'CUT EARLY'}`)
  console.log(`  CHECK success fades out (not a hard cut)      -> ${crit.fadeSteps} volume steps, min ${crit.minVol} ${crit.minVol === 0 ? 'OK' : 'NO FADE'}`)
  await p.close()

  console.log('')
  console.log('=== autoplay blocked: silent, no errors, roll still completes ===')
  const b2 = await chromium.launch({ args: [...GL, '--autoplay-policy=document-user-activation-required'] })
  const p2 = await b2.newPage({ viewport: { width: 1280, height: 800 } })
  const problems = []
  p2.on('pageerror', (e) => problems.push('PAGEERROR ' + e.message))
  p2.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE ' + m.text().slice(0, 140)) })
  await p2.goto(URL, { waitUntil: 'domcontentloaded' })
  await p2.waitForSelector('.preloader', { state: 'detached', timeout: 12000 })
  console.log('  roll completed:', true)
  console.log('  errors:', problems.length ? problems.join(' | ') : 'none')
  await p2.close()
  await b2.close()

  console.log('')
  console.log('=== muted: nothing plays ===')
  const b3 = await chromium.launch({ args: ALLOW })
  const p3 = await b3.newPage({ viewport: { width: 1280, height: 800 } })
  await p3.addInitScript(() => { try { localStorage.setItem('d20:muted', '1') } catch (e) { void e } })
  await tap(p3)
  await p3.goto(URL, { waitUntil: 'domcontentloaded' })
  await p3.waitForSelector('.preloader', { state: 'detached', timeout: 12000 })
  await p3.waitForTimeout(500)
  const plays = await p3.evaluate(() => window.__log.filter((e) => e.ev === 'play').length)
  console.log('  play() calls while muted:', plays, plays === 0 ? 'OK' : 'LEAKED')
  await p3.close()
  await b3.close()

  console.log('')
  console.log('=== skip before impact: no dice sound at all ===')
  const b4 = await chromium.launch({ args: ALLOW })
  const p4 = await b4.newPage({ viewport: { width: 1280, height: 800 } })
  await tap(p4)
  await p4.goto(URL, { waitUntil: 'domcontentloaded' })
  await p4.waitForSelector('.preloader', { timeout: 8000 })
  await p4.waitForTimeout(120)
  await p4.keyboard.press('Escape')
  await p4.waitForTimeout(900)
  const plays4 = await p4.evaluate(() => window.__log.filter((e) => e.ev === 'play').map((e) => e.name))
  console.log('  sounds played:', plays4.length ? plays4.join(', ') : 'none', plays4.length === 0 ? 'OK' : 'CHECK')
  await p4.close()
  await b4.close()

  await browser.close()
})()
