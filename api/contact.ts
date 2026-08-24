import { getMailer } from './_lib/mailer.js'
import { isHoneypotFilled, validateLead } from './_lib/validate.js'
import { templateLead } from './_lib/templates/lead.js'
import { templateReceipt } from './_lib/templates/receipt.js'

type ApiRequest = {
  method?: string
  body?: unknown
  headers: Record<string, string | string[] | undefined>
}

type ApiResponse = {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

const RATE_WINDOW_MS = 60_000
const RATE_MAX = 4
const recent = new Map<string, number[]>()

function clientKey(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return (raw ?? 'desconhecido').split(',')[0].trim()
}

function rateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (recent.get(key) ?? []).filter((at) => now - at < RATE_WINDOW_MS)
  hits.push(now)
  recent.set(key, hits)
  if (recent.size > 500) {
    for (const [k, v] of recent) {
      if (v.every((at) => now - at >= RATE_WINDOW_MS)) recent.delete(k)
    }
  }
  return hits.length > RATE_MAX
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const payload = parseBody(req.body)

  if (isHoneypotFilled(payload)) {
    res.status(200).json({ ok: true })
    return
  }

  if (rateLimited(clientKey(req))) {
    res.status(429).json({ error: 'rate_limited' })
    return
  }

  const result = validateLead(payload)
  if (!result.ok) {
    res.status(422).json({ error: 'invalid', fields: result.errors })
    return
  }

  const lead = result.lead
  const receivedAt = new Date()

  let mailer: ReturnType<typeof getMailer>
  try {
    mailer = getMailer()
  } catch (error) {
    console.error('contato: configuração de e-mail incompleta', error)
    res.status(500).json({ error: 'mail_not_configured' })
    return
  }

  const { transporter, env } = mailer

  const person = { name: lead.name, address: lead.email }
  const notice = templateLead({ lead, receivedAt, siteUrl: env.siteUrl })

  try {
    const info = await transporter.sendMail({
      from: env.from,
      to: env.to,
      replyTo: person,
      subject: notice.subject,
      text: notice.text,
      html: notice.html,
    })
    console.log(
      `contato: aviso interno aceito=${JSON.stringify(info.accepted)} recusado=${JSON.stringify(info.rejected)} id=${info.messageId}`,
    )
  } catch (error) {
    console.error('contato: falha ao enviar o aviso interno', error)
    res.status(502).json({ error: 'mail_failed' })
    return
  }

  const receipt = templateReceipt({ lead, replyTo: env.to, siteUrl: env.siteUrl })

  try {
    const info = await transporter.sendMail({
      from: env.from,
      to: person,
      replyTo: env.to,
      subject: receipt.subject,
      text: receipt.text,
      html: receipt.html,
    })
    console.log(
      `contato: confirmação ao cliente aceito=${JSON.stringify(info.accepted)} recusado=${JSON.stringify(info.rejected)} id=${info.messageId}`,
    )
    if (info.accepted.length === 0) {
      res.status(200).json({ ok: true, receipt: false })
      return
    }
  } catch (error) {
    console.error('contato: aviso interno enviado, confirmação ao cliente falhou', error)
    res.status(200).json({ ok: true, receipt: false })
    return
  }

  res.status(200).json({ ok: true, receipt: true })
}
