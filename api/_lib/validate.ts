export type Lead = {
  name: string
  email: string
  kind: string
  budget: string
  message: string
}

export type ValidationResult =
  | { ok: true; lead: Lead }
  | { ok: false; errors: Record<string, string> }

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const LIMITS = {
  name: 120,
  email: 254,
  kind: 80,
  budget: 80,
  message: 4000,
} as const

const KINDS = [
  'Sistema sob medida',
  'Aplicativo',
  'WordPress avançado',
  'Manutenção de sistema existente',
  'Ainda não sei',
]

const BUDGETS = [
  'Ainda não sei',
  'Até R$ 30 mil',
  'R$ 30 mil a R$ 80 mil',
  'R$ 80 mil a R$ 200 mil',
  'Acima de R$ 200 mil',
]

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function block(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim()
}

export function validateLead(payload: unknown): ValidationResult {
  const source = (payload ?? {}) as Record<string, unknown>
  const errors: Record<string, string> = {}

  const name = text(source.name).slice(0, LIMITS.name)
  const email = text(source.email).toLowerCase().slice(0, LIMITS.email)
  const kind = text(source.kind).slice(0, LIMITS.kind)
  const budget = text(source.budget).slice(0, LIMITS.budget)
  const message = block(source.message).slice(0, LIMITS.message)

  if (name.length < 2) errors.name = 'Informe seu nome para sabermos com quem falamos.'
  if (!email) errors.email = 'Precisamos de um e-mail para responder.'
  else if (!EMAIL_SHAPE.test(email)) errors.email = 'Confira o e-mail: falta o @ ou o domínio.'
  if (!kind || !KINDS.includes(kind)) errors.kind = 'Escolha uma opção da lista.'
  if (!budget || !BUDGETS.includes(budget)) errors.budget = 'Escolha uma opção da lista.'
  if (message.length < 20) errors.message = 'Conte um pouco mais: pelo menos 20 caracteres.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, lead: { name, email, kind, budget, message } }
}

export function isHoneypotFilled(payload: unknown): boolean {
  const source = (payload ?? {}) as Record<string, unknown>
  return typeof source.company === 'string' && source.company.trim().length > 0
}
