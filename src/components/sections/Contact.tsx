import { useRef, useState } from 'react'
import { company, contact, isPending, principles } from '../../content/site'
import { Pending } from '../ui/Pending'
import './contact.css'

type FieldName = 'name' | 'email' | 'kind' | 'budget' | 'message'
type Errors = Partial<Record<FieldName, string>>
type Status = 'idle' | 'sending' | 'sent' | 'failed'

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const LABELS: Record<FieldName, string> = {
  name: 'Nome',
  email: 'E-mail de trabalho',
  kind: 'Tipo de projeto',
  budget: 'Faixa de investimento',
  message: 'Onde a operação trava hoje',
}

function validate(name: FieldName, value: string): string | undefined {
  const trimmed = value.trim()
  if (name === 'name') {
    if (!trimmed) return 'Informe seu nome para sabermos com quem falamos.'
    if (trimmed.length < 2) return 'Nome curto demais. Use pelo menos 2 caracteres.'
    return undefined
  }
  if (name === 'email') {
    if (!trimmed) return 'Precisamos de um e-mail para responder.'
    if (!EMAIL_SHAPE.test(trimmed)) return 'Confira o e-mail: falta o @ ou o domínio.'
    return undefined
  }
  if (name === 'kind' || name === 'budget') {
    if (!trimmed) return 'Escolha uma opção da lista.'
    return undefined
  }
  if (!trimmed) return 'Descreva o problema, mesmo em duas linhas.'
  if (trimmed.length < 20) return 'Conte um pouco mais: pelo menos 20 caracteres.'
  return undefined
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p className="field-error" id={id} role="alert">
      <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M7 4v3.4M7 9.6v.1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span>{message}</span>
    </p>
  )
}

export function Contact() {
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [failure, setFailure] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const onBlur = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = event.target.name as FieldName
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(name, event.target.value) }))
  }

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = event.target.name as FieldName
    if (!touched[name]) return
    setErrors((prev) => ({ ...prev, [name]: validate(name, event.target.value) }))
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const names: FieldName[] = ['name', 'email', 'kind', 'budget', 'message']

    const found: Errors = {}
    for (const name of names) {
      const message = validate(name, String(data.get(name) ?? ''))
      if (message) found[name] = message
    }

    setTouched(Object.fromEntries(names.map((name) => [name, true])))
    setErrors(found)

    const firstInvalid = names.find((name) => found[name])
    if (firstInvalid) {
      setStatus('idle')
      const node = form.elements.namedItem(firstInvalid)
      if (node instanceof HTMLElement) node.focus()
      return
    }

    const focusFirst = (fields: Errors) => {
      const first = names.find((entry) => fields[entry])
      if (!first) return
      const node = form.elements.namedItem(first)
      if (node instanceof HTMLElement) node.focus()
    }

    setStatus('sending')
    setFailure(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          kind: String(data.get('kind') ?? ''),
          budget: String(data.get('budget') ?? ''),
          message: String(data.get('message') ?? ''),
          company: String(data.get('company') ?? ''),
        }),
      })

      if (response.status === 422) {
        const body = (await response.json().catch(() => null)) as
          | { fields?: Errors }
          | null
        const fields = body?.fields ?? {}
        setErrors(fields)
        setStatus('idle')
        focusFirst(fields)
        return
      }

      if (response.status === 429) {
        setStatus('failed')
        setFailure(
          'Recebemos várias tentativas em pouco tempo. Espere um minuto e envie de novo.',
        )
        return
      }

      if (!response.ok) {
        setStatus('failed')
        setFailure(
          'O envio falhou no nosso servidor. Tente de novo em alguns minutos ou fale com a gente pelo WhatsApp.',
        )
        return
      }

      setStatus('sent')
      form.reset()
      setTouched({})
      setErrors({})
    } catch {
      setStatus('failed')
      setFailure(
        'Não conseguimos falar com o servidor. Verifique sua conexão e tente novamente.',
      )
    }
  }

  const describedBy = (name: FieldName, hintId?: string) => {
    const ids = [errors[name] ? `${name}-error` : null, hintId ?? null].filter(Boolean)
    return ids.length ? ids.join(' ') : undefined
  }

  return (
    <section className="contact" id="contato" aria-labelledby="contact-title">
      <div className="u-shell contact-inner">
        <div className="contact-aside">
          <h2 className="u-head" id="contact-title">
            {contact.heading}
          </h2>
          <p className="contact-lede u-measure">{contact.lede}</p>

          <ul className="contact-principles">
            {principles.map((item) => (
              <li key={item.title}>
                <h3 className="contact-principle-title">{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>

          <dl className="contact-direct">
            <div>
              <dt className="u-data">E-mail</dt>
              <dd>
                {isPending(company.email) ? (
                  <Pending label="e-mail a definir" />
                ) : (
                  <a className="link-inline" href={`mailto:${company.email}`}>
                    {company.email}
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="u-data">WhatsApp</dt>
              <dd>
                {isPending(company.whatsapp) ? (
                  <Pending label="número a definir" />
                ) : (
                  <a className="link-inline" href={`https://wa.me/${company.whatsapp}`}>
                    {company.whatsapp}
                  </a>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <form
          ref={formRef}
          className="contact-form plate plate-raised"
          noValidate
          onSubmit={onSubmit}
        >
          <div className="contact-trap" aria-hidden="true">
            <label htmlFor="company">Empresa</label>
            <input
              id="company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <p className="contact-required u-data">Todos os campos são obrigatórios</p>

          <div className="contact-form-grid">
            <div className="field">
              <label className="field-label" htmlFor="name">
                {LABELS.name}
              </label>
              <input
                className="field-control"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={describedBy('name')}
                onBlur={onBlur}
                onChange={onChange}
              />
              <FieldError id="name-error" message={errors.name} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="email">
                {LABELS.email}
              </label>
              <input
                className="field-control"
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy('email')}
                onBlur={onBlur}
                onChange={onChange}
              />
              <FieldError id="email-error" message={errors.email} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="kind">
                {LABELS.kind}
              </label>
              <select
                className="field-control"
                id="kind"
                name="kind"
                required
                aria-required="true"
                defaultValue=""
                aria-invalid={Boolean(errors.kind)}
                aria-describedby={describedBy('kind')}
                onBlur={onBlur}
                onChange={onChange}
              >
                <option value="" disabled>
                  Selecione
                </option>
                {contact.kinds.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FieldError id="kind-error" message={errors.kind} />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="budget">
                {LABELS.budget}
              </label>
              <select
                className="field-control"
                id="budget"
                name="budget"
                required
                aria-required="true"
                defaultValue=""
                aria-invalid={Boolean(errors.budget)}
                aria-describedby={describedBy('budget', 'budget-hint')}
                onBlur={onBlur}
                onChange={onChange}
              >
                <option value="" disabled>
                  Selecione
                </option>
                {contact.budgets.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FieldError id="budget-error" message={errors.budget} />
              <p className="field-hint" id="budget-hint">
                Serve para saber se conseguimos atender. Não vira preço final.
              </p>
            </div>

            <div className="field contact-field-wide">
              <label className="field-label" htmlFor="message">
                {LABELS.message}
              </label>
              <textarea
                className="field-control"
                id="message"
                name="message"
                required
                aria-required="true"
                aria-invalid={Boolean(errors.message)}
                aria-describedby={describedBy('message', 'message-hint')}
                onBlur={onBlur}
                onChange={onChange}
              />
              <FieldError id="message-error" message={errors.message} />
              <p className="field-hint" id="message-hint">
                Quanto mais concreto, mais útil a resposta. Ex: “fechamento mensal é
                feito em três planilhas e trava quando duas pessoas editam junto”.
              </p>
            </div>
          </div>

          <div className="contact-submit">
            <button
              className="btn btn-copper"
              type="submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? (
                <>
                  <span className="contact-spinner" aria-hidden="true" />
                  Enviando
                </>
              ) : (
                'Enviar'
              )}
            </button>

            <p className="contact-note">Resposta em até um dia útil.</p>
          </div>

          <p className="contact-feedback" role="status" aria-live="polite" data-state={status}>
            {status === 'sent' &&
              'Recebido. Acabamos de enviar uma confirmação para o seu e-mail — respondemos em até um dia útil.'}
            {status === 'failed' && failure}
          </p>

        </form>
      </div>
    </section>
  )
}
