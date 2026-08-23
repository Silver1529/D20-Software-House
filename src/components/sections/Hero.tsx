import { useCallback, useEffect, useRef, useState } from 'react'
import { D20Canvas } from '../preloader/D20Canvas'
import { D20Engraved } from '../preloader/D20Engraved'
import { hero } from '../../content/site'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { getRollAudio } from '../../lib/audio'
import './hero.css'

const IDLE_HANDOFF_MS = 480

export function Hero() {
  const reducedMotion = usePrefersReducedMotion()
  const [webglFailed, setWebglFailed] = useState(false)
  const [rollId, setRollId] = useState(0)
  const [rolling, setRolling] = useState(false)
  const handoffRef = useRef(0)
  const showCanvas = !reducedMotion && !webglFailed

  useEffect(() => () => window.clearTimeout(handoffRef.current), [])

  const reroll = useCallback(() => {
    if (rolling) return
    getRollAudio().stop()
    setRollId((id) => id + 1)
    setRolling(true)
  }, [rolling])

  const onPhase = useCallback((phase: 'impact' | 'landed' | 'finished') => {
    const audio = getRollAudio()
    if (phase === 'impact') audio.playRoll()
    if (phase === 'landed') {
      audio.playCritical()
      handoffRef.current = window.setTimeout(() => setRolling(false), IDLE_HANDOFF_MS)
    }
  }, [])

  return (
    <section className="hero machined" id="top" aria-labelledby="hero-title">
      <div className="hero-inner u-shell">
        <div className="hero-copy">
          <p className="hero-kicker u-data">
            <span className="hero-kicker-tick" aria-hidden="true" />
            {hero.kicker}
          </p>

          <h1 className="u-display hero-title" id="hero-title">
            {hero.headline.map((line, index) => (
              <span key={line} className="hero-title-line">
                {index === hero.headline.length - 1 ? (
                  <span className="hero-title-accent">{line}</span>
                ) : (
                  line
                )}
              </span>
            ))}
          </h1>

          <p className="hero-lede u-measure">{hero.lede}</p>

          <div className="hero-actions">
            <a className="btn btn-primary" href={hero.primaryAction.href}>
              {hero.primaryAction.label}
              <svg viewBox="0 0 16 16" aria-hidden="true" className="btn-glyph">
                <path
                  d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </a>
            <a className="btn btn-ghost" href={hero.secondaryAction.href}>
              {hero.secondaryAction.label}
            </a>
          </div>

          <dl className="hero-facts">
            <div className="hero-fact">
              <dt>Escopo</dt>
              <dd>Sob medida, do zero</dd>
            </div>
            <div className="hero-fact">
              <dt>Entrega</dt>
              <dd>Ciclos de 2 semanas</dd>
            </div>
            <div className="hero-fact">
              <dt>Código</dt>
              <dd>Repositório é seu</dd>
            </div>
          </dl>
        </div>

        <div className="hero-stage">
          {showCanvas ? (
            <button
              type="button"
              className="hero-die"
              onClick={reroll}
              aria-label={
                rolling ? 'Rolando o dado' : 'Rolar o dado de vinte lados novamente'
              }
            >
              <D20Canvas
                key={rollId}
                mode={rolling ? 'roll' : 'idle'}
                onFailure={() => setWebglFailed(true)}
                onPhase={onPhase}
                className="hero-canvas"
              />
              <span className="hero-die-hint" aria-hidden="true">
                {rolling ? 'rolando' : hero.dieHint}
              </span>
            </button>
          ) : (
            <D20Engraved size={300} className="hero-engraved" />
          )}

          <p className="hero-stage-caption u-data" aria-hidden="true">
            <span>d20</span>
            <span className="hero-stage-caption-value">20 / 20</span>
            <span>crítico</span>
          </p>
        </div>
      </div>
    </section>
  )
}
