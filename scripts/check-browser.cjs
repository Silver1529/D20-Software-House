const { chromium } = require('playwright')
const OUT = 'C:/Users/migue/AppData/Local/Temp/claude/c--Repository-D20-Software-House/9227a46b-a296-42f1-9fb2-49033268f211/scratchpad/shots'
const URL = 'http://localhost:4317/'

;(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  const errors = []

  const shot = async (name, width, height) => {
    const p = await browser.newPage({ viewport: { width, height } })
    p.on('console', (m) => { if (m.type() === 'error') errors.push(`[${name}] ` + m.text()) })
    p.on('pageerror', (e) => errors.push(`[${name}] ` + e.message))
    await p.addInitScript(() => { try { sessionStorage.setItem('d20:rolled', '1') } catch {} })
    await p.goto(URL, { waitUntil: 'networkidle' })
    await p.evaluate(async () => {
      const step = Math.max(200, window.innerHeight * 0.6)
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 90))
      }
      window.scrollTo(0, 0)
      await new Promise((r) => setTimeout(r, 500))
    })
    await p.screenshot({ path: `${OUT}/v3-${name}.png`, fullPage: true })

    const audit = await p.evaluate(() => {
      const hidden = Array.from(document.querySelectorAll('.reveal')).filter(
        (n) => getComputedStyle(n).opacity === '0',
      ).length
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 1
      const isVisuallyHidden = (node) => {
        let el = node
        while (el && el !== document.body) {
          const cs = getComputedStyle(el)
          const box = el.getBoundingClientRect()
          if (cs.clipPath.startsWith('inset(50%')) return true
          if (box.width * box.height <= 4) return true
          el = el.parentElement
        }
        return false
      }
      const clipped = Array.from(document.querySelectorAll('body *'))
        .filter((n) => n.scrollWidth > n.clientWidth + 2 && n.clientWidth > 0)
        .filter((n) => {
          const o = getComputedStyle(n).overflowX
          return o !== 'auto' && o !== 'scroll'
        })
        .filter((n) => !isVisuallyHidden(n))
        .map((n) => {
          const edge = n.getBoundingClientRect().right
          const spill = Array.from(n.querySelectorAll('*')).filter(
            (d) => d.getBoundingClientRect().right > edge + 2,
          )
          const ownText = Array.from(n.childNodes).some(
            (c) => c.nodeType === 3 && c.textContent.trim().length > 0,
          )
          return {
            el: `${n.tagName.toLowerCase()}.${String(n.className).split(' ')[0]}`,
            box: `${n.clientWidth}<${n.scrollWidth}`,
            contentClipped: spill.length > 0 || ownText,
            worst: spill.length
              ? `${spill[0].tagName.toLowerCase()}.${String(spill[0].className).split(' ')[0]}`
              : ownText
                ? 'own text is cut off'
                : 'decorative bleed only',
          }
        })
      const small = Array.from(
        document.querySelectorAll('a, button, input, select, textarea, [role="tab"]'),
      )
        .filter((n) => {
          const r = n.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) return false
          if (r.height >= 44 && r.width >= 24) return false
          const parent = n.parentElement
          const own = (n.textContent || '').trim().length
          const around = (parent?.textContent || '').trim().length
          const inSentence = Boolean(parent) && around > own + 12
          if (inSentence) return false
          let probe = n
          while (probe && probe !== document.body) {
            const cs = getComputedStyle(probe)
            const box = probe.getBoundingClientRect()
            if (cs.clipPath.startsWith('inset(50%')) return false
            if (box.width * box.height <= 4) return false
            probe = probe.parentElement
          }
          return true
        })
        .map((n) => `${n.tagName.toLowerCase()}.${(n.className || '').toString().split(' ')[0]} ${Math.round(n.getBoundingClientRect().height)}px`)
      return {
        stillHidden: hidden,
        horizontalOverflow: overflow,
        clippedOverflow: [...new Set(clipped)],
        scrollWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        smallTargets: [...new Set(small)],
        h1: document.querySelectorAll('h1').length,
        landmarks: {
          header: document.querySelectorAll('header').length,
          main: document.querySelectorAll('main').length,
          footer: document.querySelectorAll('footer').length,
        },
        imgMissingAltAttr: Array.from(document.images).filter((i) => !i.hasAttribute('alt')).length,
        imgDecorative: Array.from(document.images).filter((i) => i.getAttribute('alt') === '').length,
      }
    })
    console.log(`\n== ${name} (${width}x${height}) ==`)
    console.log(JSON.stringify(audit, null, 2))
    await p.close()
  }

  await shot('xs', 320, 760)
  await shot('desk', 1440, 900)
  await shot('tab', 834, 1100)
  await shot('mob', 375, 820)

  console.log(errors.length ? '\nCONSOLE/PAGE ERRORS:\n' + errors.join('\n') : '\nNO CONSOLE ERRORS')
  await browser.close()
})()
