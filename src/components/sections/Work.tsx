import { cases, isPending, work, type CaseStudy } from '../../content/site'
import { CaseSchematic } from '../ui/CaseSchematic'
import { Pending, PendingBlock } from '../ui/Pending'
import './work.css'

const SCHEMATIC_BY_KIND: Record<string, 'system' | 'app' | 'web'> = {
  'Sistema sob medida': 'system',
  Aplicativo: 'app',
  'WordPress avançado': 'web',
}

function CaseCard({ item, featured }: { item: CaseStudy; featured: boolean }) {
  const variant = SCHEMATIC_BY_KIND[item.kind] ?? 'system'
  const hasImage = !isPending(item.image)
  const headingId = `case-${item.id}-title`

  return (
    <article
      className="case plate"
      data-featured={featured}
      data-interactive={!isPending(item.href)}
      aria-labelledby={headingId}
    >
      <div className="case-media">
        {hasImage && !isPending(item.imageAlt) ? (
          <img
            className="plate-media case-image"
            src={item.image}
            alt={item.imageAlt}
            loading="lazy"
            decoding="async"
            width={1200}
            height={880}
          />
        ) : (
          <CaseSchematic variant={variant} className="plate-media case-schematic" />
        )}
        <span className="case-kind tag">{item.kind}</span>
      </div>

      <div className="case-body">
        <h3 className="u-sub case-title" id={headingId}>
          {isPending(item.title) ? (
            <Pending label="título do case pendente" />
          ) : (
            item.title
          )}
        </h3>

        <p className="case-client u-data">
          {isPending(item.client) ? 'cliente não divulgado' : item.client}
        </p>

        {isPending(item.problem) ? (
          <PendingBlock label="problema · aguardando redação com o cliente" lines={2} />
        ) : (
          <p className="case-text">{item.problem}</p>
        )}

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

        <ul className="case-stack">
          {item.stack.map((tech) => (
            <li key={tech} className="tag tag-steel">
              {tech}
            </li>
          ))}
        </ul>
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
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path
                    d="M2 6.4 4.6 9 10 3.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                <span>{entry}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="work-invite">
          <strong>{work.invite.text}</strong> {work.invite.body}{' '}
          <a className="link-inline" href={work.invite.action.href}>
            {work.invite.action.label}
          </a>
        </p>
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
        </div>

        {hasCases ? (
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
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  )
}
