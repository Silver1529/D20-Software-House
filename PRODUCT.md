# Product

## Register

brand

## Users

Founders, product leads and marketing managers of small-to-mid Brazilian
companies who need software built and do not have an in-house engineering team.
They arrive from a referral or a search, on a phone as often as a laptop, with a
problem already in mind ("meu sistema atual nao aguenta", "preciso de um app",
"meu site WordPress e lento"). They are evaluating three or four suppliers at
once and are trying to answer one question: *are these people actually
engineers, or another agency that resells templates?*

The job to be done: decide, in under two minutes, whether D20 is competent
enough to trust with a custom build — and then have an easy way to start a
conversation.

## Product Purpose

The portfolio is the proof. D20 Software House builds custom software, mobile
apps and advanced WordPress. The site exists to demonstrate engineering
capability through the artefact itself: if the site is precise, fast and
crafted, the claim is already made before anyone reads a word of copy.

Success looks like a qualified inbound conversation started from the contact
form, from a visitor who arrived skeptical.

## Brand Personality

Three words: **machined, exact, unshowy.**

Voice is that of a senior engineer giving a straight answer — specific,
measured, no hype adjectives, no "solucoes inovadoras e disruptivas". Portuguese
(pt-BR), second person plural for the company ("construimos"), never "nos somos
apaixonados por tecnologia". The D20 is not a mascot or a gaming gimmick: it is
the brand's precision object. Twenty faces, one result, engineered tolerance.
Rolling a 20 is a critical success — that is the only place the tabletop
reference is allowed to surface, and it surfaces once.

Emotional goal: **earned confidence.** The visitor should feel they are looking
at hardware, not a landing page.

## Anti-references

- **Linear / Vercel dark mode.** Charcoal background, indigo-to-violet radial
  glow blobs, frosted cards, gradient text on the headline, three identical
  icon-heading-paragraph cards. This is the single closest trap: it is what the
  original mockup was, and what every AI generation produces for "dev agency".
- **Editorial-typographic.** Display serif italic, small-caps mono kickers,
  ruled three-column grids, monochrome restraint. The second-order reflex; not
  this brand.
- **Generic corporate illustration.** Flat isometric people at laptops, abstract
  blobs, stock "innovation" imagery.
- **Fabricated credibility.** Invented client counts, invented years in
  business, invented case studies, fake logo walls. The original mockup had all
  four. Every number on this site must be real or visibly absent.
- **Hype copy.** "Transformamos ideias em realidade", "solucoes inovadoras",
  "excelencia em cada detalhe".

## Design Principles

1. **The artefact is the argument.** Every craft decision is a competence claim.
   A janky animation or a 4.2:1 contrast ratio is not a cosmetic miss, it is
   counter-evidence. Precision is the message.
2. **Hardware, not interface.** Design the surface as a machined instrument
   panel: milled graphite, engraved numerals, copper contacts, chamfered edges,
   scribe lines. Sharp geometry over soft cards. Labels earn their place by
   carrying real data.
3. **No invented proof.** Absent content is marked absent. Better a visible gap
   than a fabricated number — the visitor is here to judge honesty as much as
   skill.
4. **One spectacle, then get out of the way.** The D20 roll is the single
   ambitious moment. It is skippable, runs once per session, and everything after
   it is quiet, fast and legible. Motion elsewhere only confirms state.
5. **Twenty faces, one result.** Range of capability, single point of
   accountability. Where a structural choice is available, prefer the one that
   expresses committed precision over the one that hedges.

## Accessibility & Inclusion

Target **WCAG 2.2 AA**, verified rather than assumed:

- Body text >= 4.5:1 against its own surface; large/bold text and UI borders
  >= 3:1. Computed with a contrast script, not eyeballed.
- `prefers-reduced-motion: reduce` removes the dice roll entirely (immediate
  content reveal, static engraved D20), and reduces every transition to a
  crossfade. The preloader must never be a barrier.
- The preloader is dismissible with click, Enter, Escape or Space, is announced
  to screen readers via `aria-live`, and is skipped outright on repeat visits
  within a session.
- Full keyboard path with visible `:focus-visible` rings; skip link to main.
- WebGL is not a requirement: an engraved SVG/CSS D20 covers no-WebGL, reduced
  motion and print.
- Form errors sit next to their field, are announced with `role="alert"`, and
  focus moves to the first invalid field on submit.
- Colour never carries meaning alone (copper "critical" state always pairs with
  text or an icon).
- Portuguese (pt-BR) as the document language, with `lang` set correctly.
