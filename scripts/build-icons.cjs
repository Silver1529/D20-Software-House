const { chromium } = require('playwright')
const { readFileSync, writeFileSync, existsSync } = require('node:fs')
const { join, dirname } = require('node:path')

const ROOT = join(__dirname, '..')
const SOURCE = join(ROOT, 'public/icons/d20-logo-source.jpg')
const BRAND_BG = '#090d10'

const TARGETS = [
  { out: 'public/icons/d20-logo.png', size: 512, pad: 0.03, background: null },
  { out: 'public/icons/d20-mark.png', size: 128, pad: 0.02, background: null },
  { out: 'public/favicon-16.png', size: 16, pad: 0, background: null },
  { out: 'public/favicon-32.png', size: 32, pad: 0, background: null },
  { out: 'public/favicon-48.png', size: 48, pad: 0, background: null },
  { out: 'public/favicon-192.png', size: 192, pad: 0.02, background: null },
  { out: 'public/apple-touch-icon.png', size: 180, pad: 0.14, background: BRAND_BG },
]

if (!existsSync(SOURCE)) {
  console.error('missing source: public/icons/d20-logo-source.jpg')
  process.exit(1)
}

const dataUrl =
  'data:image/jpeg;base64,' + readFileSync(SOURCE).toString('base64')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const results = await page.evaluate(
    async ({ src, targets, whiteCut, floodCut, chroma }) => {
      const img = new Image()
      img.src = src
      await img.decode()

      const w = img.naturalWidth
      const h = img.naturalHeight
      const base = document.createElement('canvas')
      base.width = w
      base.height = h
      const ctx = base.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, w, h)
      const px = data.data

      const lumaMin = (i) => Math.min(px[i], px[i + 1], px[i + 2])
      const chromaOf = (i) => {
        const min = Math.min(px[i], px[i + 1], px[i + 2])
        const max = Math.max(px[i], px[i + 1], px[i + 2])
        return max - min
      }
      const traversable = (i) => lumaMin(i) >= floodCut && chromaOf(i) <= chroma
      const alphaFor = (i) => {
        const min = lumaMin(i)
        if (min >= whiteCut) return 0
        const t = (whiteCut - min) / (whiteCut - floodCut)
        return Math.round(Math.min(255, Math.max(0, t * 255)))
      }

      const visited = new Uint8Array(w * h)
      const queue = []
      const push = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return
        const k = y * w + x
        if (visited[k]) return
        if (!traversable(k * 4)) return
        visited[k] = 1
        queue.push(k)
      }
      for (let x = 0; x < w; x += 1) {
        push(x, 0)
        push(x, h - 1)
      }
      for (let y = 0; y < h; y += 1) {
        push(0, y)
        push(w - 1, y)
      }
      while (queue.length) {
        const k = queue.pop()
        const x = k % w
        const y = (k - x) / w
        px[k * 4 + 3] = alphaFor(k * 4)
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)
      }

      const softened = 0

      ctx.putImageData(data, 0, 0)

      let minX = w
      let minY = h
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          if (px[(y * w + x) * 4 + 3] < 12) continue
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
      const cropW = maxX - minX + 1
      const cropH = maxY - minY + 1
      const side = Math.max(cropW, cropH)
      const offX = minX - (side - cropW) / 2
      const offY = minY - (side - cropH) / 2

      const out = []
      for (const t of targets) {
        const c = document.createElement('canvas')
        c.width = t.size
        c.height = t.size
        const g = c.getContext('2d')
        g.imageSmoothingEnabled = true
        g.imageSmoothingQuality = 'high'
        if (t.background) {
          g.fillStyle = t.background
          g.fillRect(0, 0, t.size, t.size)
        }
        const inset = t.size * t.pad
        g.drawImage(
          base,
          offX,
          offY,
          side,
          side,
          inset,
          inset,
          t.size - inset * 2,
          t.size - inset * 2,
        )
        out.push({ out: t.out, url: c.toDataURL('image/png') })
      }

      return {
        source: { w, h },
        crop: { minX, minY, cropW, cropH, side },
        keyedPixels: visited.reduce((a, v) => a + v, 0),
        softened,
        files: out,
      }
    },
    {
      src: dataUrl,
      targets: TARGETS,
      whiteCut: 244,
      floodCut: 138,
      chroma: 62,
    },
  )

  console.log(`source ${results.source.w}x${results.source.h}`)
  console.log(
    `background feathered: ${results.keyedPixels} px in the border-connected light region`,
  )
  console.log(
    `content bounds ${results.crop.cropW}x${results.crop.cropH} -> square ${results.crop.side}`,
  )

  for (const f of results.files) {
    const buf = Buffer.from(f.url.split(',')[1], 'base64')
    const path = join(ROOT, f.out)
    writeFileSync(path, buf)
    console.log(`  ${f.out.padEnd(34)} ${String(buf.length).padStart(7)} bytes`)
    void dirname(path)
  }

  await browser.close()
})()
