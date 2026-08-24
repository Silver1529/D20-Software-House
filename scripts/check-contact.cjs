const { chromium } = require('playwright')

const URL = process.env.CHECK_URL || 'http://localhost:5199/'
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']

const fill = async (p, over = {}) => {
  const v = {
    name: 'Renata Vasconcelos',
    email: 'renata@grupohorizonte.com.br',
    message:
      'O fechamento mensal roda em tres planilhas e trava quando duas pessoas editam junto.',
    ...over,
  }
  await p.fill('#name', v.name)
  await p.fill('#email', v.email)
  await p.selectOption('#kind', { index: 1 })
  await p.selectOption('#budget', { index: 1 })
  await p.fill('#message', v.message)
}

;(async () => {
  const browser = await chromium.launch({ args: GL })
  const open = async () => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    p.on('pageerror', (e) => console.log('    PAGEERROR:', e.message))
    p.on('console', (m) => {
      if (m.type() === 'error') console.log('    CONSOLE:', m.text().slice(0, 150))
    })
    await p.addInitScript(() => {
      try {
        sessionStorage.setItem('d20:rolled', '1')
      } catch (e) {
        void e
      }
    })
    await p.goto(URL, { waitUntil: 'networkidle' })
    return p
  }

  console.log('--- 1. honeypot exists, is hidden and out of tab order ---')
  {
    const p = await open()
    const trap = await p.evaluate(() => {
      const el = document.getElementById('company')
      if (!el) return null
      const wrap = el.parentElement
      const wrapBox = wrap.getBoundingClientRect()
      const box = el.getBoundingClientRect()
      const cx = Math.round(box.left + box.width / 2)
      const cy = Math.round(box.top + box.height / 2)
      const atPoint = document.elementFromPoint(cx, cy)
      return {
        tabIndex: el.tabIndex,
        autocomplete: el.getAttribute('autocomplete'),
        hiddenFromAT: Boolean(el.closest('[aria-hidden="true"]')),
        wrapperArea: Math.round(wrapBox.width * wrapBox.height),
        wrapperClip: getComputedStyle(wrap).clipPath,
        reachableByPointer: atPoint === el || el.contains(atPoint),
      }
    })
    console.log('   ', JSON.stringify(trap))
    await p.close()
  }

  console.log('--- 2. request payload shape ---')
  {
    const p = await open()
    await p.route('**/api/contact', async (route) => {
      const body = route.request().postDataJSON()
      console.log('    keys:', Object.keys(body).sort().join(', '))
      console.log('    honeypot empty:', body.company === '')
      console.log('    method:', route.request().method())
      console.log('    content-type:', route.request().headers()['content-type'])
      await route.fulfill({ status: 200, json: { ok: true, receipt: true } })
    })
    await fill(p)
    await p.click('form.contact-form button[type="submit"]')
    await p.waitForTimeout(600)
    console.log('    feedback:', await p.evaluate(() => document.querySelector('.contact-feedback')?.textContent?.trim()))
    console.log('    form reset:', await p.evaluate(() => document.getElementById('name').value === ''))
    await p.close()
  }

  console.log('--- 3. server-side 422 maps to field errors and moves focus ---')
  {
    const p = await open()
    await p.route('**/api/contact', (route) =>
      route.fulfill({
        status: 422,
        json: { error: 'invalid', fields: { email: 'Este domínio não recebe e-mail.' } },
      }),
    )
    await fill(p)
    await p.click('form.contact-form button[type="submit"]')
    await p.waitForTimeout(500)
    console.log('    error shown:', await p.evaluate(() => document.querySelector('#email-error')?.textContent?.trim()))
    console.log('    focus:', await p.evaluate(() => document.activeElement?.id))
    console.log('    aria-invalid:', await p.evaluate(() => document.getElementById('email')?.getAttribute('aria-invalid')))
    await p.close()
  }

  console.log('--- 4. 429 shows the rate-limit message ---')
  {
    const p = await open()
    await p.route('**/api/contact', (route) =>
      route.fulfill({ status: 429, json: { error: 'rate_limited' } }),
    )
    await fill(p)
    await p.click('form.contact-form button[type="submit"]')
    await p.waitForTimeout(500)
    console.log('    feedback:', await p.evaluate(() => document.querySelector('.contact-feedback')?.textContent?.trim()))
    await p.close()
  }

  console.log('--- 5. 502 shows the server-failure message ---')
  {
    const p = await open()
    await p.route('**/api/contact', (route) =>
      route.fulfill({ status: 502, json: { error: 'mail_failed' } }),
    )
    await fill(p)
    await p.click('form.contact-form button[type="submit"]')
    await p.waitForTimeout(500)
    console.log('    feedback:', await p.evaluate(() => document.querySelector('.contact-feedback')?.textContent?.trim()))
    await p.close()
  }

  console.log('--- 6. network failure shows the connection message ---')
  {
    const p = await open()
    await p.route('**/api/contact', (route) => route.abort('failed'))
    await fill(p)
    await p.click('form.contact-form button[type="submit"]')
    await p.waitForTimeout(600)
    console.log('    feedback:', await p.evaluate(() => document.querySelector('.contact-feedback')?.textContent?.trim()))
    await p.close()
  }

  await browser.close()
})()
