export const PROJECT_KINDS = [
  'Sistema sob medida',
  'Aplicativo',
  'WordPress avançado',
  'Manutenção de sistema existente',
  'Ainda não sei',
] as const

export const BUDGET_RANGES = [
  'Ainda não sei',
  'Até R$ 2.500,00',
  'R$ 2.500,00 a R$ 5.000,00',
  'R$ 5.000,00 a R$ 10.000,00',
  'Acima de R$ 10.000,00',
] as const

export type ProjectKind = (typeof PROJECT_KINDS)[number]
export type BudgetRange = (typeof BUDGET_RANGES)[number]

export const isProjectKind = (value: string): value is ProjectKind =>
  (PROJECT_KINDS as readonly string[]).includes(value)

export const isBudgetRange = (value: string): value is BudgetRange =>
  (BUDGET_RANGES as readonly string[]).includes(value)
