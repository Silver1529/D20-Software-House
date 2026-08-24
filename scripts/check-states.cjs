const { chromium } = require('playwright')
const OUT = 'C:/Users/migue/AppData/Local/Temp/claude/c--Repository-D20-Software-House/9227a46b-a296-42f1-9fb2-49033268f211/scratchpad/shots'
const URL = 'http://localhost:4317/'
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']

const newPage = async (browser, opts = {}) => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...opts })
  p.on('pageerror', (e) => console.log('  PAGEERROR:', e.message))
  p.on('console', (m) => {
    if (m.type() === 'error') console.log('  CONSOLE:', m.text().slice(0, 160))
  })
  return p
}

const stubContact = (p) =>
  p.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, json: { ok: true, receipt: true } }),
  )

const skipRoll = (p) =>
  p.addInitScript(() => {
    try {
      sessionStorage.setItem('d20:rolled', '1')
    } catch (e) {
      void e
    }
  })

;(async () => {
  const browser = await chromium.launch({ args: GL })

  console.log('--- 1. reduced motion skips the roll entirely ---')
  {
    const p = await newPage(browser, { reducedMotion: 'reduce' })
    await p.goto(URL, { waitUntil: 'domcontentloaded' })
    console.log('  preloader mounted:', await p.evaluate(() => Boolean(document.querySelector('.preloader'))))
    console.log('  hero title visible:', await p.evaluate(() => {
      const h = document.querySelector('#hero-title')
      return Boolean(h) && getComputedStyle(h).opacity === '1'
    }))
    console.log('  static engraved D20 shown:', await p.evaluate(() => Boolean(document.querySelector('.hero-engraved'))))
    console.log('  body scroll locked:', await p.evaluate(() => document.body.dataset.scrollLocked === 'true'))
    await p.screenshot({ path: OUT + '/state-reduced-motion.png' })
    await p.close()
  }

  console.log('--- 2. Escape skips the roll ---')
  {
    const p = await newPage(browser)
    await p.goto(URL, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.preloader', { timeout: 8000 })
    await p.keyboard.press('Escape')
    await p.waitForSelector('.preloader', { state: 'detached', timeout: 5000 })
    console.log('  preloader dismissed by Escape: true')
    console.log('  scroll unlocked:', await p.evaluate(() => document.body.dataset.scrollLocked === undefined))
    console.log('  session flag set:', await p.evaluate(() => sessionStorage.getItem('d20:rolled')))
    await p.close()
  }

  console.log('--- 3. repeat visit in same session does not roll again ---')
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const p = await ctx.newPage()
    await p.goto(URL, { waitUntil: 'domcontentloaded' })
    await p.waitForSelector('.preloader', { state: 'detached', timeout: 12000 })
    await p.goto(URL, { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(300)
    console.log('  preloader on second load:', await p.evaluate(() => Boolean(document.querySelector('.preloader'))))
    await ctx.close()
  }

  console.log('--- 4. capabilities tablist keyboard navigation ---')
  {
    const p = await newPage(browser)
    await skipRoll(p)
    await p.goto(URL, { waitUntil: 'networkidle' })
    await p.locator('[role="tab"]').first().focus()
    const read = () =>
      p.evaluate(() => ({
        selected: document
          .querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent?.replace(/\s+/g, ' ')
          .trim()
          .slice(0, 34),
        panel: document.querySelector('[role="tabpanel"]')?.id,
        focusIsTab: document.activeElement?.getAttribute('role') === 'tab',
      }))
    console.log('  initial:      ', JSON.stringify(await read()))
    await p.keyboard.press('ArrowDown')
    console.log('  ArrowDown:    ', JSON.stringify(await read()))
    await p.keyboard.press('End')
    console.log('  End:          ', JSON.stringify(await read()))
    await p.keyboard.press('ArrowDown')
    console.log('  wraps around: ', JSON.stringify(await read()))
    console.log('  roving tabindex:', JSON.stringify(await p.evaluate(() =>
      Array.from(document.querySelectorAll('[role="tab"]')).map((t) => t.tabIndex))))
    await p.locator('#servicos').screenshot({ path: OUT + '/state-tablist.png' })
    await p.close()
  }

  console.log('--- 5. form: empty submit ---')
  {
    const p = await newPage(browser)
    await skipRoll(p)
    await p.goto(URL, { waitUntil: 'networkidle' })
    await p.locator('form.contact-form button[type="submit"]').click()
    await p.waitForTimeout(400)
    const state = await p.evaluate(() => ({
      alerts: Array.from(document.querySelectorAll('[role="alert"]')).map((n) => n.textContent.trim()),
      focused: document.activeElement?.id,
      invalid: Array.from(document.querySelectorAll('[aria-invalid="true"]')).map((n) => n.id),
      describedBy: document.getElementById('name')?.getAttribute('aria-describedby'),
    }))
    console.log('  errors shown:', state.alerts.length)
    state.alerts.forEach((a) => console.log('    -', a))
    console.log('  focus moved to first invalid:', state.focused)
    console.log('  aria-invalid on:', JSON.stringify(state.invalid))
    console.log('  name aria-describedby:', state.describedBy)
    await p.locator('#contato').screenshot({ path: OUT + '/state-form-errors.png' })
    await p.close()
  }

  console.log('--- 6. form: inline validation then success ---')
  {
    const p = await newPage(browser)
    await skipRoll(p)
    await stubContact(p)
    await p.goto(URL, { waitUntil: 'networkidle' })
    await p.fill('#email', 'nao-e-email')
    await p.locator('#name').focus()
    await p.waitForTimeout(250)
    console.log('  blur validation:', await p.evaluate(() => document.querySelector('#email-error')?.textContent?.trim()))
    await p.fill('#name', 'Taina')
    await p.fill('#email', 'taina@empresa.com.br')
    await p.selectOption('#kind', { index: 1 })
    await p.selectOption('#budget', { index: 1 })
    await p.fill('#message', 'O fechamento mensal roda em tres planilhas e trava quando duas pessoas editam junto.')
    await p.locator('form.contact-form button[type="submit"]').click()
    await p.waitForTimeout(150)
    console.log('  disabled while sending:', await p.evaluate(() => document.querySelector('form.contact-form button[type=submit]')?.disabled))
    await p.waitForTimeout(1400)
    console.log('  feedback:', await p.evaluate(() => document.querySelector('.contact-feedback')?.textContent?.trim()))
    console.log('  form reset:', await p.evaluate(() => document.getElementById('name').value === ''))
    await p.locator('#contato').screenshot({ path: OUT + '/state-form-success.png' })
    await p.close()
  }

  console.log('--- 7. skip link is the first tab stop ---')
  {
    const p = await newPage(browser)
    await skipRoll(p)
    await p.goto(URL, { waitUntil: 'networkidle' })
    await p.keyboard.press('Tab')
    console.log('  first tab stop:', JSON.stringify(await p.evaluate(() => {
      const a = document.activeElement
      return { text: a?.textContent?.trim(), cls: a?.className, outline: getComputedStyle(a).outlineWidth }
    })))
    await p.screenshot({ path: OUT + '/state-skip-link.png', clip: { x: 0, y: 0, width: 470, height: 140 } })
    await p.close()
  }

  console.log('--- 8. mobile menu disclosure ---')
  {
    const p = await newPage(browser, { viewport: { width: 375, height: 820 } })
    await skipRoll(p)
    await p.goto(URL, { waitUntil: 'networkidle' })
    const toggle = p.locator('.site-menu-toggle')
    console.log('  aria-expanded before:', await toggle.getAttribute('aria-expanded'))
    await toggle.click()
    await p.waitForTimeout(250)
    console.log('  aria-expanded after: ', await toggle.getAttribute('aria-expanded'))
    console.log('  panel visible:', await p.locator('#site-menu').isVisible())
    await p.screenshot({ path: OUT + '/state-mobile-menu.png', clip: { x: 0, y: 0, width: 375, height: 430 } })
    await p.keyboard.press('Escape')
    await p.waitForTimeout(250)
    console.log('  Escape closes:', await toggle.getAttribute('aria-expanded'))
    console.log('  focus returned:', await p.evaluate(() => document.activeElement?.classList.contains('site-menu-toggle')))
    await p.close()
  }

  await browser.close()
})()
