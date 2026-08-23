import { useRef, useState } from 'react'
import { capabilities } from '../../content/site'
import './capabilities.css'

export function Capabilities() {
  const [active, setActive] = useState(0)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

  const move = (delta: number) => {
    const next = (active + delta + capabilities.length) % capabilities.length
    setActive(next)
    tabsRef.current[next]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setActive(0)
      tabsRef.current[0]?.focus()
    }
    if (event.key === 'End') {
      event.preventDefault()
      const last = capabilities.length - 1
      setActive(last)
      tabsRef.current[last]?.focus()
    }
  }

  const current = capabilities[active]

  return (
    <section className="capabilities" id="servicos" aria-labelledby="capabilities-title">
      <div className="u-shell">
        <div className="capabilities-head">
          <h2 className="u-head" id="capabilities-title">
            Três frentes, uma engenharia
          </h2>
          <p className="capabilities-lede u-measure">
            Não vendemos horas soltas. Cada frente tem entregáveis definidos, e a
            mesma pessoa que desenha a arquitetura assina o código.
          </p>
        </div>

        <div className="capabilities-panel plate">
          <div
            className="capabilities-tabs"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Frentes de trabalho"
            onKeyDown={onKeyDown}
          >
            {capabilities.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabsRef.current[index] = node
                }}
                type="button"
                role="tab"
                id={`cap-tab-${item.id}`}
                aria-selected={index === active}
                aria-controls={`cap-panel-${item.id}`}
                tabIndex={index === active ? 0 : -1}
                className="capabilities-tab"
                onClick={() => setActive(index)}
              >
                <span className="capabilities-tab-index u-data">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="capabilities-tab-body">
                  <span className="capabilities-tab-name">{item.name}</span>
                  <span className="capabilities-tab-summary">{item.summary}</span>
                </span>
              </button>
            ))}
          </div>

          <div
            className="capabilities-detail"
            role="tabpanel"
            id={`cap-panel-${current.id}`}
            aria-labelledby={`cap-tab-${current.id}`}
            tabIndex={0}
          >
            <p className="capabilities-detail-body u-measure">{current.detail}</p>

            <div className="capabilities-detail-grid">
              <div>
                <h3 className="capabilities-detail-label u-data">Entregáveis</h3>
                <ul className="capabilities-list">
                  {current.deliverables.map((entry) => (
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
              </div>

              <div>
                <h3 className="capabilities-detail-label u-data">Stack habitual</h3>
                <ul className="capabilities-stack">
                  {current.stack.map((tech) => (
                    <li key={tech} className="tag tag-steel">
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
