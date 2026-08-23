import { cases, isPending, type CaseStudy } from '../../content/site'
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

export function Work() {
  const pendingCount = cases.filter((item) => isPending(item.title)).length

  return (
    <section className="work" id="projetos" aria-labelledby="work-title">
      <div className="u-shell">
        <div className="work-head">
          <div>
            <h2 className="u-head" id="work-title">
              Projetos
            </h2>
            <p className="work-lede u-measure">
              A maior parte do que construímos roda dentro de operações fechadas.
              Estamos liberando os cases com autorização de cada cliente — nada de
              número inventado enquanto isso.
            </p>
          </div>

          {pendingCount > 0 && (
            <p className="work-status u-data" role="status">
              <span className="work-status-dot" aria-hidden="true" />
              {pendingCount} de {cases.length} cases em liberação
            </p>
          )}
        </div>

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

        <p className="work-foot">
          Precisa falar com um cliente nosso antes de decidir?{' '}
          <a className="link-inline" href="#contato">
            Pedimos a referência para você
          </a>
        </p>
      </div>
    </section>
  )
}
