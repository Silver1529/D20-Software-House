type D20EngravedProps = {
  size?: number
  className?: string
  title?: string
}

const OUTER = [
  [120, 14],
  [212, 67],
  [212, 173],
  [120, 226],
  [28, 173],
  [28, 67],
] as const

const INNER = [
  [120, 172],
  [74, 92],
  [166, 92],
] as const

const points = (list: ReadonlyArray<readonly [number, number]>) =>
  list.map(([x, y]) => `${x},${y}`).join(' ')

export function D20Engraved({
  size = 240,
  className,
  title = 'Dado de vinte lados mostrando o número 20',
}: D20EngravedProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="d20-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.31 0.05 250)" />
          <stop offset="0.52" stopColor="oklch(0.19 0.02 250)" />
          <stop offset="1" stopColor="oklch(0.27 0.045 250)" />
        </linearGradient>
        <radialGradient id="d20-core" cx="0.5" cy="0.52" r="0.5">
          <stop offset="0" stopColor="oklch(0.86 0.09 235)" stopOpacity="0.5" />
          <stop offset="1" stopColor="oklch(0.66 0.115 250)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="120" cy="120" r="74" fill="url(#d20-core)" />

      <polygon
        points={points(OUTER)}
        fill="url(#d20-body)"
        stroke="oklch(0.66 0.115 250)"
        strokeWidth="2"
      />

      <g
        stroke="oklch(0.52 0.09 250)"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M120 14 74 92M120 14 166 92M28 67 74 92M212 67 166 92" />
        <path d="M28 173 74 92M212 173 166 92M28 173 120 172M212 173 120 172M120 226 120 172" />
      </g>

      <polygon
        points={points(INNER)}
        fill="oklch(0.66 0.115 250 / 0.08)"
        stroke="oklch(0.745 0.13 58)"
        strokeWidth="1.8"
      />

      <g fill="oklch(0.745 0.13 58)">
        {[...OUTER, ...INNER].map(([x, y], index) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={index < 6 ? 3.4 : 2.6} />
        ))}
      </g>

      <text
        x="120"
        y="132"
        textAnchor="middle"
        fill="oklch(0.968 0.004 252)"
        fontFamily="Archivo, sans-serif"
        fontSize="46"
        fontWeight="800"
        style={{ fontVariationSettings: "'wdth' 112, 'wght' 800" }}
      >
        20
      </text>
    </svg>
  )
}
