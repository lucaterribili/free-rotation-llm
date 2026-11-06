import type { ReactNode } from 'react'

// Page header: a clean title and a one-line description, actions on the right.
// `eyebrow` is an optional small label above the title.
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
    <header className={`mb-8 ${divider ? 'border-b pb-6' : ''}`}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-[1.75rem] leading-tight sm:text-[2rem]">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex max-w-full flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
