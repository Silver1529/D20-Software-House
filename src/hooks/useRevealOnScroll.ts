import { useEffect } from 'react'
import { prefersReducedMotionNow } from './usePrefersReducedMotion'

const FAILSAFE_MS = 1200

export function useRevealOnScroll(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    const show = (node: HTMLElement) => {
      node.removeAttribute('data-hidden')
      node.setAttribute('data-shown', 'true')
    }

    if (prefersReducedMotionNow() || typeof IntersectionObserver === 'undefined') {
      for (const node of nodes) show(node)
      return
    }

    const pending: HTMLElement[] = []
    for (const node of nodes) {
      if (node.getBoundingClientRect().top < window.innerHeight * 0.9) {
        show(node)
        continue
      }
      node.setAttribute('data-hidden', 'true')
      pending.push(node)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          show(entry.target as HTMLElement)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )

    for (const node of pending) observer.observe(node)

    const failsafe = window.setTimeout(() => {
      for (const node of pending) show(node)
    }, FAILSAFE_MS)

    return () => {
      window.clearTimeout(failsafe)
      observer.disconnect()
      for (const node of nodes) node.removeAttribute('data-hidden')
    }
  }, [enabled])
}
