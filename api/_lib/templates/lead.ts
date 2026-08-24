import type { Lead } from '../validate.js'
import { joinText, renderShell, type EmailRender } from './shell.js'

export type LeadTemplateInput = {
  lead: Lead
  receivedAt: Date
  siteUrl: string
}

function formatStamp(date: Date): string {
  const day = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  return `${day} às ${time}`
}

export function templateLead(input: LeadTemplateInput): EmailRender {
  const { lead, receivedAt, siteUrl } = input
  const firstName = lead.name.split(/\s+/)[0] ?? lead.name
  const stamp = formatStamp(receivedAt)

  const subject = `Novo contato do site — ${lead.name} · ${lead.kind}`

  const html = renderShell({
    siteUrl,
    preheader: `${lead.name} quer falar sobre ${lead.kind}. Faixa: ${lead.budget}.`,
    eyebrow: 'Novo contato pelo site',
    title: `${firstName} preencheu o formulário`,
    intro:
      'Responda direto neste e-mail: o campo de resposta já está apontado para o endereço que a pessoa informou.',
    rows: [
      { label: 'nome', value: lead.name },
      { label: 'e-mail', value: lead.email, href: `mailto:${lead.email}` },
      { label: 'projeto', value: lead.kind },
      { label: 'faixa', value: lead.budget },
      { label: 'recebido', value: stamp },
    ],
    quote: { label: 'onde a operação trava hoje', body: lead.message },
    callout: {
      label: 'prazo prometido no site',
      body: 'A página diz resposta em até um dia útil. O relógio começou agora.',
      action: {
        label: `Responder ${firstName}`,
        href: `mailto:${lead.email}?subject=${encodeURIComponent(`Re: seu contato com a D20 Software House`)}`,
      },
    },
    footnote:
      'Este aviso foi gerado pelo formulário de contato do site. Se você não esperava recebê-lo, verifique o endpoint /api/contact.',
  })

  const text = joinText([
    'NOVO CONTATO PELO SITE',
    '',
    `Nome:     ${lead.name}`,
    `E-mail:   ${lead.email}`,
    `Projeto:  ${lead.kind}`,
    `Faixa:    ${lead.budget}`,
    `Recebido: ${stamp}`,
    '',
    'ONDE A OPERAÇÃO TRAVA HOJE',
    lead.message,
    '',
    'Responda direto neste e-mail para falar com a pessoa.',
    `Prazo prometido no site: um dia útil.`,
    '',
    siteUrl,
  ])

  return { subject, html, text }
}
