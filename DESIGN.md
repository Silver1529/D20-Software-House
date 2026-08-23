# Design

## Visual Theme

**Anodized instrument panel.** The surface is treated as milled graphite
hardware: engraved numerals, copper contact points, chamfered corners, scribe
lines, faint machined grid. Not "dark mode with a glow" — a physical object.

**Named references:** Teenage Engineering product pages (machined aluminium,
everything labelled like hardware, functional numerals, warm accent on
graphite); Nothing phone (exposed structure, dot-matrix numerals). Precision of
Klim's typography **without** its editorial-serif lane.

**Explicitly not:** Linear/Vercel dark mode (indigo radial blobs, frosted cards,
gradient headline text, three identical icon cards). That was the original
mockup and it is the reflex this design exists to escape.

Dark is not the default here, it is the scene: a founder comparing suppliers at
21:00 on a laptop, room lights low, four tabs open. The surface should read as
instrumentation on a bench, not as a document.

## Color

**Strategy: Committed.** Graphite carries ~80% of the surface, copper carries
identity at ~8%, steel-blue is the interactive material, cyan is technical
annotation only (~2%). OKLCH throughout, tinted +0.009-0.016 chroma toward hue
252 (the brand's blue) — never toward warm-by-default.

| Token | OKLCH | Hex | Role |
|---|---|---|---|
| `--ink-000` | `0.155 0.009 252` | `#090d10` | page ground |
| `--ink-050` | `0.185 0.010 252` | `#101317` | alternate band |
| `--ink-100` | `0.215 0.011 252` | `#161a1e` | panel |
| `--ink-200` | `0.262 0.013 252` | `#20252b` | raised / inset |
| `--ink-300` | `0.335 0.015 252` | `#31373e` | decorative hairline |
| `--edge` | `0.445 0.016 252` | `#4e555d` | scribe line |
| `--edge-strong` | `0.520 0.016 252` | `#626a72` | form-control boundary |
| `--fg-000` | `0.968 0.004 252` | `#f2f5f7` | display / primary |
| `--fg-100` | `0.858 0.008 252` | `#cdd1d5` | body |
| `--fg-200` | `0.735 0.011 252` | `#a4aab0` | secondary |
| `--fg-300` | `0.640 0.013 252` | `#878d94` | quietest legible |
| `--steel` | `0.660 0.115 250` | `#5897d6` | interactive material |
| `--steel-hi` | `0.800 0.090 250` | `#91c3f6` | hover / highlight |
| `--copper` | `0.745 0.130 58` | `#e99653` | brand contact, critical |
| `--copper-hi` | `0.845 0.105 66` | `#fbbe81` | copper hover |
| `--cyan` | `0.800 0.105 205` | `#5ed1de` | technical annotation |

### Verified contrast (computed, not estimated)

Every foreground passes **AA on every surface**:

- `fg-100` body on `ink-000` → **12.69:1**; on `ink-100` → **11.37:1**
- `fg-300`, the quietest text used, on `ink-000` → **5.82:1** (still AA body)
- `steel` on `ink-000` → **6.31:1**; `copper` → **8.34:1**; `cyan` → **10.86:1**
- `--edge-strong` on `ink-000` → **3.55:1**, on `ink-100` → **3.18:1** (passes
  the 3:1 non-text boundary rule for inputs, WCAG 1.4.11)
- `--edge` (2.57:1) is **decorative only** — never the sole boundary of a control

**Buttons take dark engraved text, not white.** `fg-000` on `steel` is only
2.82:1 and fails; `ink-000` on `steel` is **6.31:1** and `ink-000` on `copper`
is **8.34:1**. Dark-on-anodized is both compliant and the correct material read.

## Typography

**One superfamily, two axes.** Archivo variable (`wght` 100-900, `wdth` 62-125)
— a grotesque with genuine width contrast, so display and body are the same
voice at different machine settings. Chosen over Inter and Space Grotesk, both
of which are training-data reflex fonts and the direct cause of the generic
look. Martian Mono appears **only on real data** (face indices, dice notation,
versions, coordinates) — never as decorative "technical" garnish.

| Role | Family | Settings |
|---|---|---|
| Display | Archivo | `wdth 115`, `wght 800`, tracking `-0.025em`, `clamp(2.6rem, 6vw, 5.25rem)` |
| Section head | Archivo | `wdth 108`, `wght 700`, tracking `-0.02em`, `clamp(1.75rem, 3vw, 2.6rem)` |
| Body | Archivo | `wdth 100`, `wght 400`, `1.0625rem`, line-height `1.7`, max `68ch` |
| Label | Archivo | `wdth 100`, `wght 600`, `0.8125rem` |
| Data | Martian Mono | `wght 400`, `0.6875rem`, tracking `0.06em` |

Display ceiling 84px (under the 96px shout limit). Tracking floor `-0.025em`
(above the `-0.04em` collision floor). Line-height 1.7 on body — light type on
dark needs the extra 0.05-0.1. Scale ratio 1.28.

## Geometry & Effects

- **Radius is zero.** Chamfered corners via `clip-path` polygon (a machined
  bevel), never `border-radius`. This is the "geometria afiada" requirement and
  it is what separates the surface from the rounded-glass reflex.
- **Glass is used twice, both load-bearing:** the sticky header over scrolling
  content, and the preloader scrim. `backdrop-filter: blur()` to signal
  dismissal/layering, never as card decoration.
- **Machined grid:** 1px `repeating-linear-gradient` at ~3% opacity, 48px pitch.
- **Scribe lines:** 1px `--edge` rules with a copper tick at one end.
- **Elevation** is expressed by an inset top highlight (`inset 0 1px 0`
  `--ink-300`) plus a hard outer shadow — a metal edge catching light, not a
  soft blur.
- **z-index scale:** `--z-base 0`, `--z-sticky 20`, `--z-overlay 40`,
  `--z-modal 60`, `--z-preloader 100`.

## Motion

| Token | Curve | Use |
|---|---|---|
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | state changes |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | reveals, settle |
| `--dur-tap` | `110ms` | press feedback |
| `--dur-state` | `220ms` | hover, focus, toggle |
| `--dur-reveal` | `560ms` | section entrance |

No bounce, no elastic. Exits at ~75% of entrance duration. One signature
moment (the D20 roll) and nothing else competes with it.

## The D20 roll (signature)

A real icosahedron in WebGL, 20 numbered faces, landing exactly on 20.

**Sequence** (2.62s total, skippable, once per session):

| Phase | Window | What happens |
|---|---|---|
| fall | 0-820ms | free fall from `y=7.2` under `g=26`, tumble on a tilted axis at 5.6 rad/s |
| impact | 820ms | squash to `1.20/0.78`, shockwave ring, 24-spark burst, screen flash |
| bounce | 820-1780ms | two damped hops, restitution `0.42` then `0.15` |
| settle | 1780-2240ms | slerp to the face-20 quaternion, easing `outExpo`, spin decays into the lock |
| lock | 2240-2620ms | face-20 emissive ramps, edge lines brighten, halo blooms |
| exit | 2380-2620ms | die scales to 1.9 and dissolves, scrim crossfades out |

**The landing math.** For face *i* with normal `n_i`, the orientation that puts
that face flat against the camera is `q_i = quaternionFromUnitVectors(n_i, +Z)`.
Setting `mesh.quaternion = q_20` points face 20 at the camera by construction —
no search, no trial, exact. The same `q_i` is reused to build the texture atlas:
rotating a face's three vertices by `q_i` flattens them into the XY plane, and
those flattened 2D coordinates *are* the UV mapping into that face's atlas cell.
This is why every numeral sits upright and centred on its own face, including
the 20.

Reduced motion and no-WebGL both fall back to a static engraved SVG D20 already
showing 20, with content revealed immediately.

## Content integrity

`src/content/site.ts` is the single source of copy and data. Anything not yet
supplied by the business is marked `TODO` there **and rendered as a visible
absence** — never as an invented number. Case-study media slots render a
per-project engraved SVG schematic until a real screenshot path is provided;
dropping a path into the content file replaces the schematic automatically.

## Code conventions

No comments in source files, by request. Naming, small pure modules and this
document carry the explanation instead.
