export const ROLL_SOUND = '/sounds/dice-roll.mp3'
export const CRITICAL_SOUND = '/sounds/critical-hit.mp3'

export const CRITICAL_WINDOW_MS = 1500
const CRITICAL_FADE_MS = 340
const ROLL_FADE_MS = 420
const MIN_GAP_MS = 520
const ROLL_RETRY_MS = 620
const CRITICAL_RETRY_MS = 1400
const ROLL_VOLUME = 0.5
const CRITICAL_VOLUME = 0.62
const FADE_TICK_MS = 25
const MUTE_KEY = 'd20:muted'
const GESTURES = ['pointerdown', 'keydown', 'touchstart'] as const

export type RollAudio = {
  playRoll: () => void
  playCritical: () => void
  setMuted: (muted: boolean) => void
  isBlocked: () => boolean
  subscribe: (listener: () => void) => () => void
  stop: () => void
  dispose: () => void
}

export function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    return
  }
}

function load(src: string, volume: number): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  try {
    const el = new Audio(src)
    el.preload = 'auto'
    el.volume = volume
    return el
  } catch {
    return null
  }
}

type Deferred = { run: () => void; until: number }

export function createRollAudio(): RollAudio {
  const roll = load(ROLL_SOUND, ROLL_VOLUME)
  const critical = load(CRITICAL_SOUND, CRITICAL_VOLUME)
  const timers = new Set<number>()
  const listeners = new Set<() => void>()
  let disposed = false
  let muted = readMuted()
  let blocked = false
  let rollStartedAt = 0
  let criticalQueued = false
  let deferred: Deferred | null = null

  const now = () =>
    typeof performance !== 'undefined' ? performance.now() : Date.now()

  const notify = () => {
    for (const listener of listeners) listener()
  }

  const after = (delay: number, run: () => void) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      if (!disposed) run()
    }, delay)
    timers.add(id)
  }

  const clearTimers = () => {
    for (const id of timers) window.clearTimeout(id)
    timers.clear()
  }

  const halt = (el: HTMLAudioElement | null, restore: number) => {
    if (!el) return
    el.pause()
    try {
      el.currentTime = 0
    } catch {
      el.volume = restore
      return
    }
    el.volume = restore
  }

  const fadeOut = (
    el: HTMLAudioElement | null,
    duration: number,
    restore: number,
  ) => {
    if (!el || el.paused) return
    const from = el.volume
    const steps = Math.max(1, Math.round(duration / FADE_TICK_MS))
    let step = 0
    const tick = () => {
      if (disposed) return
      step += 1
      el.volume = Math.max(0, from * (1 - step / steps))
      if (step < steps) {
        after(FADE_TICK_MS, tick)
        return
      }
      halt(el, restore)
    }
    after(FADE_TICK_MS, tick)
  }

  const play = (
    el: HTMLAudioElement | null,
    volume: number,
    retryFor: number,
    retry: () => void,
  ) => {
    if (!el || muted) return
    try {
      el.currentTime = 0
    } catch {
      return
    }
    el.volume = volume
    let attempt: Promise<void> | undefined
    try {
      attempt = el.play()
    } catch {
      attempt = undefined
    }
    if (!attempt || typeof attempt.then !== 'function') return
    attempt.then(
      () => {
        if (!blocked) return
        blocked = false
        notify()
      },
      () => {
        deferred = { run: retry, until: now() + retryFor }
        if (blocked) return
        blocked = true
        notify()
      },
    )
  }

  const playRoll = () => {
    rollStartedAt = now()
    play(roll, ROLL_VOLUME, ROLL_RETRY_MS, playRoll)
  }

  const fireCritical = () => {
    fadeOut(roll, ROLL_FADE_MS, ROLL_VOLUME)
    play(critical, CRITICAL_VOLUME, CRITICAL_RETRY_MS, fireCritical)
    after(CRITICAL_WINDOW_MS - CRITICAL_FADE_MS, () =>
      fadeOut(critical, CRITICAL_FADE_MS, CRITICAL_VOLUME),
    )
  }

  const playCritical = () => {
    if (criticalQueued) return
    criticalQueued = true
    const elapsed = rollStartedAt ? now() - rollStartedAt : MIN_GAP_MS
    const wait = Math.max(0, MIN_GAP_MS - elapsed)
    if (wait === 0) {
      fireCritical()
      return
    }
    after(wait, fireCritical)
  }

  const onGesture = () => {
    const pending = deferred
    deferred = null
    if (!pending || muted) return
    if (now() > pending.until) return
    pending.run()
  }

  if (typeof window !== 'undefined') {
    for (const event of GESTURES) {
      window.addEventListener(event, onGesture, { capture: true, passive: true })
    }
  }

  return {
    playRoll,
    playCritical,
    setMuted: (next: boolean) => {
      muted = next
      if (next) deferred = null
    },
    isBlocked: () => blocked,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    stop: () => {
      clearTimers()
      criticalQueued = false
      deferred = null
      halt(roll, ROLL_VOLUME)
      halt(critical, CRITICAL_VOLUME)
    },
    dispose: () => {
      disposed = true
      clearTimers()
      listeners.clear()
      deferred = null
      for (const event of GESTURES) {
        window.removeEventListener(event, onGesture, { capture: true })
      }
      halt(roll, ROLL_VOLUME)
      halt(critical, CRITICAL_VOLUME)
    },
  }
}

let shared: RollAudio | null = null

export function getRollAudio(): RollAudio {
  if (!shared) shared = createRollAudio()
  return shared
}

export function resetRollAudio(): void {
  if (!shared) return
  shared.stop()
}
