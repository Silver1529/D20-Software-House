import './pending.css'

export type PendingProps = {
  label: string
  hint?: string
  as?: 'span' | 'p' | 'div'
}

export function Pending({ label, hint, as = 'span' }: PendingProps) {
  const Tag = as
  return (
    <Tag className="pending" title={hint ?? `${label} ainda não informado`}>
      <span className="pending-bar" aria-hidden="true" />
      <span className="pending-text">{label}</span>
    </Tag>
  )
}

export function PendingBlock({ label, lines = 2 }: { label: string; lines?: number }) {
  return (
    <div className="pending-block" role="note">
      <p className="pending-block-label u-data">{label}</p>
      <div className="pending-block-lines" aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <span key={index} style={{ inlineSize: `${92 - index * 18}%` }} />
        ))}
      </div>
    </div>
  )
}
