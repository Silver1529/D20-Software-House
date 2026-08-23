import type { ReactElement } from 'react'

type Variant = 'system' | 'app' | 'web'

export type CaseSchematicProps = {
  variant: Variant
  className?: string
}

const STROKE = 'oklch(0.52 0.075 250)'
const STROKE_SOFT = 'oklch(0.38 0.04 250)'
const ACCENT = 'oklch(0.745 0.13 58)'
const GLOW = 'oklch(0.66 0.115 250)'

function SystemSchematic() {
  return (
    <g fill="none" strokeLinecap="square">
      <g stroke={STROKE_SOFT} strokeWidth="1">
        <path d="M64 58h72M136 58v40M136 98h72M64 58v84M64 142h72M136 142v-44" />
        <path d="M208 98v72M208 170h-56M152 170v-28" />
      </g>
      <g stroke={STROKE} strokeWidth="1.4">
        <rect x="30" y="42" width="68" height="32" />
        <rect x="30" y="126" width="68" height="32" />
        <rect x="118" y="84" width="76" height="36" />
        <rect x="214" y="152" width="62" height="36" />
      </g>
      <rect x="118" y="84" width="76" height="36" fill={GLOW} opacity="0.1" />
      <g stroke={ACCENT} strokeWidth="1.6">
        <path d="M194 102h20M262 120v32" />
        <circle cx="220" cy="102" r="3.2" fill={ACCENT} />
        <circle cx="262" cy="116" r="3.2" fill={ACCENT} />
      </g>
      <g stroke={STROKE_SOFT} strokeWidth="1" opacity="0.75">
        <path d="M232 44h44M232 54h30M232 64h38" />
      </g>
    </g>
  )
}

function AppSchematic() {
  return (
    <g fill="none">
      <rect x="106" y="26" width="94" height="172" stroke={STROKE} strokeWidth="1.4" />
      <rect x="106" y="26" width="94" height="172" fill={GLOW} opacity="0.07" />
      <path d="M138 26h30" stroke={STROKE} strokeWidth="3" />
      <g stroke={STROKE_SOFT} strokeWidth="1">
        <path d="M118 54h70M118 66h44" />
        <rect x="118" y="82" width="70" height="34" />
        <rect x="118" y="124" width="32" height="24" />
        <rect x="156" y="124" width="32" height="24" />
        <path d="M118 162h70" />
      </g>
      <rect x="118" y="82" width="70" height="34" fill={ACCENT} opacity="0.16" />
      <g stroke={ACCENT} strokeWidth="1.5">
        <path d="M132 176h12M156 176h12M180 176h4" />
      </g>
      <g stroke={STROKE_SOFT} strokeWidth="1" opacity="0.6">
        <rect x="34" y="66" width="46" height="92" />
        <rect x="226" y="66" width="46" height="92" />
        <path d="M80 112h26M200 112h26" />
      </g>
    </g>
  )
}

function WebSchematic() {
  return (
    <g fill="none">
      <rect x="34" y="34" width="238" height="156" stroke={STROKE} strokeWidth="1.4" />
      <path d="M34 56h238" stroke={STROKE} strokeWidth="1.4" />
      <g fill={STROKE_SOFT}>
        <circle cx="48" cy="45" r="2.6" />
        <circle cx="58" cy="45" r="2.6" />
        <circle cx="68" cy="45" r="2.6" />
      </g>
      <rect x="50" y="72" width="120" height="46" fill={GLOW} opacity="0.12" />
      <g stroke={STROKE_SOFT} strokeWidth="1">
        <rect x="50" y="72" width="120" height="46" />
        <path d="M50 132h120M50 144h86M50 156h104" />
        <rect x="186" y="72" width="70" height="46" />
        <rect x="186" y="132" width="70" height="24" />
      </g>
      <g stroke={ACCENT} strokeWidth="1.8">
        <path d="M186 172h70" />
        <path d="M186 172h58" strokeWidth="3.2" />
      </g>
      <g stroke={STROKE_SOFT} strokeWidth="1" opacity="0.7">
        <path d="M50 172h24M84 172h18" />
      </g>
    </g>
  )
}

const VARIANTS: Record<Variant, () => ReactElement> = {
  system: SystemSchematic,
  app: AppSchematic,
  web: WebSchematic,
}

const LABELS: Record<Variant, string> = {
  system: 'Esquema técnico: serviços, banco de dados e integrações de um sistema sob medida',
  app: 'Esquema técnico: telas de um aplicativo iOS e Android',
  web: 'Esquema técnico: estrutura de página e indicador de performance de um site WordPress',
}

export function CaseSchematic({ variant, className }: CaseSchematicProps) {
  const Drawing = VARIANTS[variant]
  return (
    <svg
      viewBox="0 0 306 224"
      className={className}
      role="img"
      aria-label={LABELS[variant]}
      preserveAspectRatio="xMidYMid meet"
    >
      <Drawing />
    </svg>
  )
}
