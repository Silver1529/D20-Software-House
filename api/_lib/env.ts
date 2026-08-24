export type MailEnv = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  to: string
  siteUrl: string
}

function required(name: string): string {
  const raw = process.env[name]
  if (!raw || !raw.trim()) throw new Error(`variável de ambiente ausente: ${name}`)
  return raw.trim()
}

function optional(name: string, fallback: string): string {
  const raw = process.env[name]
  return raw && raw.trim() ? raw.trim() : fallback
}

export function readMailEnv(): MailEnv {
  const user = required('MAIL_USER')
  return {
    host: optional('MAIL_HOST', 'smtp.gmail.com'),
    port: Number(optional('MAIL_PORT', '465')),
    secure: optional('MAIL_SECURE', 'true') !== 'false',
    user,
    pass: required('MAIL_PASS').replace(/\s+/g, ''),
    from: optional('MAIL_FROM', `D20 Software House <${user}>`),
    to: optional('MAIL_TO', user),
    siteUrl: optional('SITE_URL', 'https://d20-software-house.vercel.app').replace(
      /\/+$/,
      '',
    ),
  }
}
