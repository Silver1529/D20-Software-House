import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { D20Canvas } from './D20Canvas'
import { D20Engraved } from './D20Engraved'
import { MARKS } from '../../lib/d20-timeline'
import { readMuted, writeMuted, type RollAudio } from '../../lib/audio'
import './preloader.css'

const SESSION_KEY = 'd20:rolled'
const FALLBACK_HOLD_MS = 900

type Stage = 'rolling' | 'landed' | 'gone'

export const shouldSkipPreloader = (): boolean => {
  if (typeof window === 'undefined') return true
  try {
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') return true
  } catch {
    void 0
  }
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return true
  }
  return false
}

const markRolled = () => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    void 0
  }
}

function SpeakerGlyph({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M2.5 6.6h2.2L8.4 3.6v10.8L4.7 11.4H2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M11.4 6.6l4.1 4.8M15.5 6.6l-4.1 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M11.3 6.2a4 4 0 0 1 0 5.6M13.6 4.2a7 7 0 0 1 0 9.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export type D20PreloaderProps = {
  onDone: () => void
  audio: RollAudio
}

export function D20Preloader({ onDone, audio }: D20PreloaderProps) {
  const [stage, setStage] = useState<Stage>('rolling')
  const [startAt, setStartAt] = useState(0)
  const [webglFailed, setWebglFailed] = useState(false)
  const [muted, setMuted] = useState(readMuted)
  const [blocked, setBlocked] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    audio.setMuted(muted)
    if (muted) audio.stop()
  }, [muted, audio])

  useEffect(
    () => audio.subscribe(() => setBlocked(audio.isBlocked())),
    [audio],
  )

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    markRolled()
    setStage('gone')
    onDone()
  }, [onDone])

  const skip = useCallback(() => {
    if (doneRef.current) return
    if (startAt >= MARKS.exitStart) return
    audio.stop()
    setStartAt(MARKS.exitStart)
  }, [startAt, audio])

  const toggleMuted = useCallback(() => {
    setMuted((value) => {
      const next = !value
      writeMuted(next)
      return next
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'm' || event.key === 'M') {
        toggleMuted()
        return
      }
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        skip()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [skip, toggleMuted])

  useEffect(() => {
    document.body.dataset.scrollLocked = 'true'
    return () => {
      delete document.body.dataset.scrollLocked
    }
  }, [])

  useEffect(() => {
    if (!webglFailed) return
    const timer = window.setTimeout(finish, FALLBACK_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [webglFailed, finish])

  const landed = stage === 'landed'

  return (
    <AnimatePresence>
      {stage !== 'gone' && (
        <motion.div
          className="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          onClick={skip}
        >
          <div className="preloader-scrim" />
          <div className="preloader-stage">
            {webglFailed ? (
              <D20Engraved size={260} className="preloader-engraved" />
            ) : (
              <D20Canvas
                mode="roll"
                startAtMs={startAt}
                onFailure={() => setWebglFailed(true)}
                onPhase={(phase) => {
                  if (phase === 'impact') audio.playRoll()
                  if (phase === 'landed') {
                    setStage('landed')
                    audio.playCritical()
                  }
                  if (phase === 'finished') finish()
                }}
                className="preloader-canvas"
              />
            )}
          </div>

          <div className="preloader-hud">
            <p className="preloader-mark">
              <span className="preloader-mark-strong">D20</span>
              <span className="preloader-mark-rule" />
              <span>Software House</span>
            </p>

            <p className="preloader-readout u-data" data-landed={landed}>
              <span>{landed ? 'resultado' : 'rolando'}</span>
              <span className="preloader-readout-value">
                {landed ? '20 / 20' : 'd20'}
              </span>
              <span>{landed ? 'crítico' : '—'}</span>
            </p>

            <div className="preloader-controls">
              <button
                type="button"
                className="preloader-mute"
                aria-pressed={muted}
                data-blocked={blocked && !muted}
                onClick={(event) => {
                  event.stopPropagation()
                  if (blocked && !muted) {
                    setBlocked(false)
                    return
                  }
                  toggleMuted()
                }}
              >
                <SpeakerGlyph muted={muted || blocked} />
                <span className="preloader-mute-label">
                  {muted ? 'som off' : blocked ? 'ativar som' : 'som on'}
                </span>
              </button>

              <button
                type="button"
                className="preloader-skip"
                onClick={(event) => {
                  event.stopPropagation()
                  skip()
                }}
              >
                Ir para o site
              </button>
            </div>
          </div>

          <p aria-live="polite" className="preloader-sr">
            {landed
              ? 'Dado parado no vinte. Carregando o site.'
              : 'Rolando o dado de abertura. Pressione Esc para ir direto ao site.'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
