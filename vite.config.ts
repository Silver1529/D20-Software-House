import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

function adaptResponse(res: ServerResponse): ApiResponse {
  const api: ApiResponse = {
    status: (code) => {
      res.statusCode = code
      return api
    },
    json: (body) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(body))
    },
    setHeader: (name, value) => {
      res.setHeader(name, value)
    },
  }
  return api
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 64_000) {
        reject(new Error('corpo grande demais'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function contactApi(env: Record<string, string>): Plugin {
  return {
    name: 'd20-contact-api',
    apply: 'serve',
    configureServer(server) {
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }

      server.middlewares.use('/api/contact', async (req, res) => {
        try {
          const raw = req.method === 'POST' ? await readBody(req) : ''
          const module = await server.ssrLoadModule('/api/contact.ts')
          const handler = module.default as (
            request: unknown,
            response: ApiResponse,
          ) => Promise<void>
          await handler(
            { method: req.method, body: raw, headers: req.headers },
            adaptResponse(res),
          )
        } catch (error) {
          server.config.logger.error(`/api/contact falhou: ${String(error)}`)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'dev_handler_failed' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), contactApi(env)],
    build: {
      target: 'es2022',
      cssTarget: 'chrome111',
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
          },
        },
      },
    },
  }
})
