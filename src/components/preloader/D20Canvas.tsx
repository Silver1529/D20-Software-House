import { useEffect, useRef } from 'react'
import { createD20Stage, type D20Stage } from '../../lib/d20-scene'
import { waitForAtlasFont } from '../../lib/d20-atlas'
import { MARKS, sampleD20 } from '../../lib/d20-timeline'

const ATLAS_FONT = 'Archivo, sans-serif'

export type D20CanvasProps = {
  mode: 'roll' | 'idle'
  startAtMs?: number
  onPhase?: (phase: 'impact' | 'landed' | 'finished') => void
  onFailure?: () => void
  className?: string
}

export function D20Canvas({
  mode,
  startAtMs = 0,
  onPhase,
  onFailure,
  className,
}: D20CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef(onPhase)
  const failureRef = useRef(onFailure)

  phaseRef.current = onPhase
  failureRef.current = onFailure

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let stage: D20Stage | null = null
    let raf = 0
    let cancelled = false
    let impactSent = startAtMs >= MARKS.impact1
    let landedSent = startAtMs >= MARKS.rest
    let finishedSent = false
    let origin: number | null = null
    const pointer = { x: 0, y: 0 }
    const smoothed = { x: 0, y: 0 }

    const onPointerMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect()
      if (!box.width || !box.height) return
      pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1
      pointer.y = ((event.clientY - box.top) / box.height) * 2 - 1
    }

    const onResize = () => stage?.resize()

    const start = async () => {
      await waitForAtlasFont(ATLAS_FONT)
      if (cancelled) return

      try {
        stage = createD20Stage(canvas, {
          fontFamily: ATLAS_FONT,
          landOn: 20,
          frame: mode,
        })
      } catch {
        failureRef.current?.()
        return
      }

      window.addEventListener('resize', onResize)
      if (mode === 'idle') window.addEventListener('pointermove', onPointerMove)

      const loop = (now: number) => {
        if (cancelled || !stage) return
        if (origin === null) origin = now

        if (mode === 'roll') {
          const t = startAtMs + (now - origin)
          const frame = sampleD20(t)
          stage.applyRoll(frame)
          if (!impactSent && t >= MARKS.impact1) {
            impactSent = true
            phaseRef.current?.('impact')
          }
          if (!landedSent && t >= MARKS.rest) {
            landedSent = true
            phaseRef.current?.('landed')
          }
          if (frame.finished) {
            stage.render()
            if (!finishedSent) {
              finishedSent = true
              phaseRef.current?.('finished')
            }
            return
          }
        } else {
          smoothed.x += (pointer.x - smoothed.x) * 0.055
          smoothed.y += (pointer.y - smoothed.y) * 0.055
          stage.applyIdle(now - origin, smoothed)
        }

        stage.render()
        raf = requestAnimationFrame(loop)
      }

      raf = requestAnimationFrame(loop)
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      stage?.dispose()
    }
  }, [mode, startAtMs])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
