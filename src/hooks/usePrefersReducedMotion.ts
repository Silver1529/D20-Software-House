import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export const prefersReducedMotionNow = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(QUERY).matches

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotionNow)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(QUERY)
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}
