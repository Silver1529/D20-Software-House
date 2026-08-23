import { useEffect, useRef, useState } from 'react'
import { company, nav } from '../../content/site'
import './site-header.css'

function BrandMark() {
  return (
    <img
      className="brand-mark"
      src="/icons/d20-mark.png"
      alt=""
      width={34}
      height={34}
      decoding="async"
    />
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [lifted, setLifted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      if (toggleRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <header className="site-header glass" data-lifted={lifted}>
      <div className="site-header-inner u-shell">
        <a href="#top" className="brand" aria-label={`${company.name}, ir para o topo`}>
          <BrandMark />
          <span className="brand-text">
            <span className="brand-name">D20</span>
            <span className="brand-suffix">Software House</span>
          </span>
        </a>

        <nav className="site-nav" aria-label="Navegação principal">
          <ul className="site-nav-list">
            {nav.map((item) => (
              <li key={item.href}>
                <a className="nav-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="btn btn-primary site-nav-cta" href="#contato">
            Começar um projeto
          </a>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="site-menu-toggle"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="site-menu-toggle-label">{open ? 'Fechar' : 'Menu'}</span>
          <span className="site-menu-toggle-glyph" data-open={open} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </div>

      <div
        ref={panelRef}
        id="site-menu"
        className="site-menu"
        data-open={open}
        hidden={!open}
      >
        <ul className="site-menu-list u-shell">
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setOpen(false)}>
                <span>{item.label}</span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
