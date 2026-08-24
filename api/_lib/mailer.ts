import nodemailer, { type Transporter } from 'nodemailer'
import { readMailEnv, type MailEnv } from './env.js'

let cached: { transporter: Transporter; env: MailEnv } | null = null

export function getMailer(): { transporter: Transporter; env: MailEnv } {
  if (cached) return cached

  const env = readMailEnv()
  const transporter = nodemailer.createTransport({
    host: env.host,
    port: env.port,
    secure: env.secure,
    auth: { user: env.user, pass: env.pass },
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })

  cached = { transporter, env }
  return cached
}
