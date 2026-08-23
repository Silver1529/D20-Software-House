import { useCallback, useState } from 'react'
import { D20Preloader, shouldSkipPreloader } from './components/preloader/D20Preloader'
import { SiteHeader } from './components/layout/SiteHeader'
import { SiteFooter } from './components/layout/SiteFooter'
import { Hero } from './components/sections/Hero'
import { Capabilities } from './components/sections/Capabilities'
import { Process } from './components/sections/Process'
import { Work } from './components/sections/Work'
import { Contact } from './components/sections/Contact'
import { useRevealOnScroll } from './hooks/useRevealOnScroll'
import { getRollAudio } from './lib/audio'

export default function App() {
  const [rolling, setRolling] = useState(() => !shouldSkipPreloader())
  const audio = rolling ? getRollAudio() : null

  useRevealOnScroll(!rolling)

  const onPreloaderDone = useCallback(() => {
    setRolling(false)
    const main = document.getElementById('conteudo')
    if (main) {
      main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
      main.removeAttribute('tabindex')
    }
  }, [])

  return (
    <>
      {rolling && audio && <D20Preloader onDone={onPreloaderDone} audio={audio} />}

      <a className="u-skip" href="#conteudo">
        Ir para o conteúdo
      </a>

      <div inert={rolling ? true : undefined}>
        <SiteHeader />
        <main id="conteudo">
          <Hero />
          <Capabilities />
          <Process />
          <Work />
          <Contact />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
