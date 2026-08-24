import { contact } from '../src/content/site.ts'
import { validateLead } from '../api/_lib/validate.ts'
import { BUDGET_RANGES, PROJECT_KINDS } from '../shared/contact-options.ts'

let fail = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`)
  if (!ok) fail += 1
}

const base = {
  name: 'Renata Vasconcelos',
  email: 'renata@empresa.com.br',
  message: 'O fechamento mensal roda em tres planilhas e trava quando duas editam junto.',
}

check(
  'o formulário oferece exatamente as faixas compartilhadas',
  JSON.stringify(contact.budgets) === JSON.stringify([...BUDGET_RANGES]),
  `${contact.budgets.length} opções`,
)
check(
  'o formulário oferece exatamente os tipos compartilhados',
  JSON.stringify(contact.kinds) === JSON.stringify([...PROJECT_KINDS]),
  `${contact.kinds.length} opções`,
)

let allAccepted = true
const rejected = []
for (const budget of contact.budgets) {
  for (const kind of contact.kinds) {
    const result = validateLead({ ...base, kind, budget })
    if (!result.ok) {
      allAccepted = false
      rejected.push(`${kind} / ${budget} -> ${JSON.stringify(result.errors)}`)
    }
  }
}
check(
  'o servidor aceita TODA combinação que o formulário permite escolher',
  allAccepted,
  allAccepted
    ? `${contact.budgets.length * contact.kinds.length} combinações`
    : rejected[0],
)

const bogus = validateLead({ ...base, kind: 'Sistema sob medida', budget: 'R$ 1 bilhão' })
check(
  'o servidor recusa faixa que não está na lista',
  !bogus.ok && Boolean(bogus.errors.budget),
)

const bogusKind = validateLead({ ...base, kind: 'Foguete', budget: 'Ainda não sei' })
check(
  'o servidor recusa tipo que não está na lista',
  !bogusKind.ok && Boolean(bogusKind.errors.kind),
)

const injection = validateLead({
  ...base,
  name: '<script>alert(1)</script>',
  kind: 'Aplicativo',
  budget: 'Ainda não sei',
})
check('input com HTML passa pela validação para ser escapado no template', injection.ok)

console.log(`\n${fail === 0 ? 'ALL CHECKS PASSED' : fail + ' CHECK(S) FAILED'}`)
process.exit(fail === 0 ? 0 : 1)
