import type { Lead } from '../validate.js'
import { joinText, renderShell, type EmailRender } from './shell.js'

export type ReceiptTemplateInput = {
  lead: Lead
  replyTo: string
  siteUrl: string
}

export function templateReceipt(input: ReceiptTemplateInput): EmailRender {
  const { lead, replyTo, siteUrl } = input
  const firstName = lead.name.split(/\s+/)[0] ?? lead.name

  const subject = 'Recebemos seu contato — D20 Software House'

  const html = renderShell({
    siteUrl,
    preheader:
      'Sua mensagem chegou. Respondemos em até um dia útil com uma primeira leitura técnica.',
    eyebrow: 'Contato recebido',
    title: `${firstName}, sua mensagem chegou`,
    intro:
      'Obrigado pelo contato. Uma pessoa vai ler o que você escreveu — não é resposta automática de robô com proposta genérica.\n\nGuardamos abaixo uma cópia do que você enviou, para você ter registro.',
    rows: [
      { label: 'projeto', value: lead.kind },
      { label: 'faixa', value: lead.budget },
      { label: 'seu e-mail', value: lead.email },
    ],
    quote: { label: 'o que você nos contou', body: lead.message },
    steps: {
      label: 'o que acontece agora',
      items: [
        'Lemos a sua mensagem e olhamos o contexto que você descreveu.',
        'Respondemos em até um dia útil com uma primeira leitura técnica: o que dá para fazer, o que precisa de mais informação e o que talvez não valha a pena.',
        'Se fizer sentido para os dois lados, marcamos uma conversa. Sem compromisso até aqui.',
      ],
    },
    callout: {
      label: 'precisa complementar algo?',
      body: `Basta responder este e-mail. Ele chega direto em ${replyTo}.`,
    },
    footnote:
      'Você recebeu este e-mail porque preencheu o formulário de contato no site da D20 Software House. Não enviamos newsletter nem repassamos seu endereço.',
  })

  const text = joinText([
    `${firstName}, sua mensagem chegou.`,
    '',
    'Obrigado pelo contato. Uma pessoa vai ler o que você escreveu.',
    'Respondemos em até um dia útil com uma primeira leitura técnica.',
    '',
    'CÓPIA DO QUE VOCÊ ENVIOU',
    `Projeto:    ${lead.kind}`,
    `Faixa:      ${lead.budget}`,
    `Seu e-mail: ${lead.email}`,
    '',
    lead.message,
    '',
    'O QUE ACONTECE AGORA',
    '01  Lemos a sua mensagem e olhamos o contexto que você descreveu.',
    '02  Respondemos em até um dia útil com uma primeira leitura técnica.',
    '03  Se fizer sentido para os dois lados, marcamos uma conversa.',
    '',
    `Precisa complementar algo? Responda este e-mail — ele chega em ${replyTo}.`,
    '',
    siteUrl,
  ])

  return { subject, html, text }
}
