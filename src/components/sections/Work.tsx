import { cases, isPending, work, type CaseStudy } from '../../content/site'
import { CaseSchematic } from '../ui/CaseSchematic'
import './work.css'

const SCHEMATIC_BY_KIND: Record<string, 'system' | 'app' | 'web'> = {
  'Sistema sob medida': 'system',
  Aplicativo: 'app',
  'WordPress avançado': 'web',
  'Site institucional': 'web',
}

const hostOf = (href: string) => {
  try {
    return new URL(href).host
  } catch {
    return href
  }
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2 6.4 4.6 9 10 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ExternalGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="case-link-glyph">
      <path
        d="M6 3.5H3.5v9h9V10M9.5 3.5h3v3M12.5 3.5 7.5 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CaseCard({ item, featured }: { item: CaseStudy; featured: boolean }) {
  const variant = SCHEMATIC_BY_KIND[item.kind] ?? 'system'
  const hasImage = !isPending(item.image) && !isPending(item.imageAlt)
  const hasLink = !isPending(item.href)
  const headingId = `case-${item.id}-title`

  return (
    <article
      className="case plate"
      data-featured={featured}
      data-interactive={hasLink}
      aria-labelledby={headingId}
    >
      <div className="case-media" data-has-image={hasImage}>
        {hasImage ? (
          <img
            className="plate-media case-image"
            src={item.image}
            alt={item.imageAlt}
            loading="lazy"
            decoding="async"
            width={1280}
            height={800}
          />
        ) : (
          <CaseSchematic variant={variant} className="plate-media case-schematic" />
        )}
        <span className="case-kind tag">{item.kind}</span>
      </div>

      <div className="case-body">
        <div className="case-head">
          <h3 className="u-sub case-title" id={headingId}>
            {item.name}
          </h3>
          <p className="case-segment u-data">{item.segment}</p>
        </div>

        <p className="case-text">{item.summary}</p>

        <ul className="case-features">
          {item.features.map((entry) => (
            <li key={entry}>
              <CheckGlyph />
              <span>{entry}</span>
            </li>
          ))}
        </ul>

        {!isPending(item.metrics) && (
          <dl className="case-metrics">
            {item.metrics.map((metric) => (
              <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="case-foot">
          <ul className="case-stack">
            {item.stack.map((tech) => (
              <li key={tech} className="tag tag-steel">
                {tech}
              </li>
            ))}
          </ul>

          {hasLink && (
            <a
              className="case-link link-inline"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${work.linkLabel} ${item.name} (abre em nova aba)`}
            >
              <span className="case-link-host">{hostOf(item.href)}</span>
              <ExternalGlyph />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function EmptyState() {
  return (
    <div className="work-empty">
      <div className="work-column">
        <section className="work-panel plate" aria-labelledby="work-promise-title">
          <p className="work-panel-label tag">{work.empty.label}</p>
          <h3 className="u-sub work-panel-title" id="work-promise-title">
            {work.empty.heading}
          </h3>
          <p className="work-panel-body">{work.empty.body}</p>

          <ul className="work-promise">
            {work.empty.promise.map((entry) => (
              <li key={entry}>
                <CheckGlyph />
                <span>{entry}</span>
              </li>
            ))}
          </ul>
        </section>

        <Invite />
      </div>

      <section
        className="work-panel work-panel-evidence plate"
        aria-labelledby="work-evidence-title"
      >
        <p className="work-panel-label tag tag-steel">{work.evidence.label}</p>
        <h3 className="u-sub work-panel-title" id="work-evidence-title">
          {work.evidence.heading}
        </h3>
        <p className="work-panel-body">{work.evidence.body}</p>

        <dl className="work-spec">
          {work.evidence.rows.map((row) => (
            <div className="work-spec-row" key={row.label}>
              <dt className="work-spec-label u-data">{row.label}</dt>
              <dd className="work-spec-value">{row.value}</dd>
              <dd className="work-spec-note">{row.note}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

function Invite() {
  return (
    <p className="work-invite">
      <strong>{work.invite.text}</strong> {work.invite.body}{' '}
      <a className="link-inline" href={work.invite.action.href}>
        {work.invite.action.label}
      </a>
    </p>
  )
}

export function Work() {
  const hasCases = cases.length > 0

  return (
    <section className="work" id="projetos" aria-labelledby="work-title">
      <div className="u-shell">
        <div className="work-head">
          <h2 className="u-head" id="work-title">
            {work.heading}
          </h2>
          <p className="work-lede u-measure">{work.lede}</p>
          {hasCases && (
            <p className="work-status u-data">
              <span className="work-status-dot" aria-hidden="true" />
              {work.status(cases.length)}
            </p>
          )}
        </div>

        {hasCases ? (
          <>
            <div className="work-grid">
              {cases.map((item, index) => (
                <div
                  key={item.id}
                  className="reveal work-cell"
                  data-featured={index === 0}
                  style={{ '--i': index } as React.CSSProperties}
                >
                  <CaseCard item={item} featured={index === 0} />
                </div>
              ))}
            </div>

            <div className="work-after reveal" style={{ '--i': cases.length } as React.CSSProperties}>
              <Invite />
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  )
}
