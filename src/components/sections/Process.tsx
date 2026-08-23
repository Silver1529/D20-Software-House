import { process } from '../../content/site'
import './process.css'

export function Process() {
  return (
    <section className="process" id="processo" aria-labelledby="process-title">
      <div className="u-shell">
        <div className="process-head">
          <h2 className="u-head" id="process-title">
            Como um projeto anda
          </h2>
          <p className="process-lede u-measure">
            Quatro etapas, nessa ordem. Você sabe o que recebe no fim de cada uma
            antes de assinar qualquer coisa.
          </p>
        </div>

        <ol className="process-track">
          {process.map((step, index) => (
            <li
              key={step.step}
              className="process-step reveal"
              style={{ '--i': index } as React.CSSProperties}
            >
              <div className="process-step-marker">
                <span className="process-step-number">
                  {String(step.step).padStart(2, '0')}
                </span>
                <span className="process-step-rule" aria-hidden="true" />
              </div>

              <div className="process-step-body">
                <p className="process-step-duration u-data">{step.duration}</p>
                <h3 className="u-sub process-step-name">{step.name}</h3>
                <p className="process-step-text">{step.body}</p>
                <p className="process-step-output">
                  <svg viewBox="0 0 14 14" aria-hidden="true">
                    <path
                      d="M2 7h8M7.5 3.5 11 7l-3.5 3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>{step.output}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
