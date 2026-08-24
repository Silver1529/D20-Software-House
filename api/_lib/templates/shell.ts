export type EmailRender = {
  subject: string
  html: string
  text: string
}

export type SpecRow = { label: string; value: string; href?: string }

export type ShellInput = {
  preheader: string
  eyebrow: string
  title: string
  intro: string
  rows?: SpecRow[]
  quote?: { label: string; body: string }
  callout?: { label: string; body: string; action?: { label: string; href: string } }
  steps?: { label: string; items: string[] }
  footnote: string
  siteUrl: string
}

export const INK = '#090d10'
const INK_SOFT = '#1b2129'
const PAGE = '#eef1f4'
const CARD = '#ffffff'
const LINE = '#dde3e9'
const LINE_SOFT = '#eaeef2'
const TEXT = '#1d242c'
const TEXT_SOFT = '#59636e'
const TEXT_FAINT = '#7b858f'
const STEEL = '#2f6fae'
const COPPER = '#a85a17'
const COPPER_TINT = '#fdf3e8'

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Courier New',monospace"

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function paragraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((chunk) => escapeHtml(chunk).replace(/\n/g, '<br />'))
    .map(
      (chunk) =>
        `<p style="margin:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.65;color:${TEXT};">${chunk}</p>`,
    )
    .join('')
}

function renderRows(rows: SpecRow[]): string {
  const cells = rows
    .map((row, index) => {
      const border = index === 0 ? 'none' : `1px solid ${LINE_SOFT}`
      const value = row.href
        ? `<a href="${escapeHtml(row.href)}" style="color:${STEEL};text-decoration:none;font-weight:600;">${escapeHtml(row.value)}</a>`
        : escapeHtml(row.value)
      return `<tr>
        <td style="padding:11px 0;border-top:${border};font-family:${MONO};font-size:11px;letter-spacing:0.04em;color:${TEXT_FAINT};white-space:nowrap;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:11px 0 11px 18px;border-top:${border};font-family:${FONT};font-size:15px;line-height:1.5;color:${TEXT};font-weight:600;">${value}</td>
      </tr>`
    })
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:4px 0 20px;">${cells}</table>`
}

function renderQuote(quote: { label: string; body: string }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:4px 0 20px;">
    <tr><td style="background:#f6f8fa;border:1px solid ${LINE};padding:16px 18px;">
      <p style="margin:0 0 8px;font-family:${MONO};font-size:11px;letter-spacing:0.04em;color:${TEXT_FAINT};">${escapeHtml(quote.label)}</p>
      <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.7;color:${TEXT};white-space:pre-wrap;">${escapeHtml(quote.body)}</p>
    </td></tr>
  </table>`
}

function renderCallout(callout: NonNullable<ShellInput['callout']>): string {
  const action = callout.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 0;border-collapse:collapse;">
        <tr><td style="background:${INK};padding:12px 22px;">
          <a href="${escapeHtml(callout.action.href)}" style="font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;display:inline-block;">${escapeHtml(callout.action.label)}</a>
        </td></tr>
      </table>`
    : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:4px 0 20px;">
    <tr><td style="background:${COPPER_TINT};border:1px solid #f0d9bd;padding:16px 18px;">
      <p style="margin:0 0 6px;font-family:${MONO};font-size:11px;letter-spacing:0.04em;color:${COPPER};">${escapeHtml(callout.label)}</p>
      <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${TEXT};">${escapeHtml(callout.body)}</p>
      ${action}
    </td></tr>
  </table>`
}

function renderSteps(steps: { label: string; items: string[] }): string {
  const items = steps.items
    .map(
      (item, index) =>
        `<tr>
          <td style="padding:0 12px 10px 0;font-family:${MONO};font-size:12px;font-weight:600;color:${COPPER};vertical-align:top;line-height:1.6;">${String(index + 1).padStart(2, '0')}</td>
          <td style="padding:0 0 10px;font-family:${FONT};font-size:15px;line-height:1.6;color:${TEXT};">${escapeHtml(item)}</td>
        </tr>`,
    )
    .join('')
  return `<p style="margin:4px 0 12px;font-family:${MONO};font-size:11px;letter-spacing:0.04em;color:${TEXT_FAINT};">${escapeHtml(steps.label)}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 20px;">${items}</table>`
}

export function renderShell(input: ShellInput): string {
  const logo = `${input.siteUrl}/icons/d20-mark.png`

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:${PAGE};">
<tr><td align="center" style="padding:28px 14px 36px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;border-collapse:collapse;">

<tr><td style="background:${INK};padding:20px 26px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">
<tr>
<td width="34" style="width:34px;padding-right:12px;vertical-align:middle;">
<img src="${escapeHtml(logo)}" width="34" height="34" alt="" style="display:block;width:34px;height:34px;border:0;" />
</td>
<td style="vertical-align:middle;">
<span style="font-family:${FONT};font-size:16px;font-weight:700;letter-spacing:0.06em;color:#ffffff;">D20</span>
<span style="font-family:${FONT};font-size:13px;font-weight:400;color:#9aa4ae;padding-left:7px;">Software House</span>
</td>
<td align="right" style="vertical-align:middle;">
<span style="font-family:${MONO};font-size:10px;letter-spacing:0.1em;color:#e99653;">20 / 20</span>
</td>
</tr>
</table>
</td></tr>

<tr><td style="background:${CARD};border-left:1px solid ${LINE};border-right:1px solid ${LINE};padding:30px 26px 24px;">
<p style="margin:0 0 10px;font-family:${MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${COPPER};">${escapeHtml(input.eyebrow)}</p>
<h1 style="margin:0 0 14px;font-family:${FONT};font-size:23px;line-height:1.25;font-weight:700;letter-spacing:-0.01em;color:${INK_SOFT};">${escapeHtml(input.title)}</h1>
${paragraphs(input.intro)}
${input.rows ? renderRows(input.rows) : ''}
${input.quote ? renderQuote(input.quote) : ''}
${input.steps ? renderSteps(input.steps) : ''}
${input.callout ? renderCallout(input.callout) : ''}
</td></tr>

<tr><td style="background:${CARD};border:1px solid ${LINE};border-top:0;padding:18px 26px 22px;">
<p style="margin:0;font-family:${FONT};font-size:12.5px;line-height:1.6;color:${TEXT_SOFT};">${escapeHtml(input.footnote)}</p>
</td></tr>

<tr><td style="padding:16px 26px 0;">
<p style="margin:0;font-family:${MONO};font-size:10.5px;line-height:1.7;letter-spacing:0.03em;color:${TEXT_FAINT};">
D20 Software House &nbsp;·&nbsp; <a href="${escapeHtml(input.siteUrl)}" style="color:${TEXT_FAINT};text-decoration:underline;">${escapeHtml(input.siteUrl.replace(/^https?:\/\//, ''))}</a>
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export function joinText(parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join('\n')
}
