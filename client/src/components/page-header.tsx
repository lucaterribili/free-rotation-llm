import type { ReactNode } from 'react'

// Editorial page header: a heavy rule, a serif title, a one-line dek. `eyebrow`
// is the small mono label above the title (section number, kicker).
export function PageHeader({
  title,
  description,
  actions,
  divider = true,
  eyebrow,
}: {
  title: string
  description?: string
  actions?: ReactNode
  divider?: boolean
  eyebrow?: string
}) {
  return (
    <header className="mb-8">
      <div className="rule-heavy pt-4">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <div className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-4 ${divider ? 'pb-6 border-b' : ''}`}>
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-[2.5rem] leading-[1.04] sm:text-5xl">{title}</h1>
            {description && (
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex max-w-full flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  )
}
