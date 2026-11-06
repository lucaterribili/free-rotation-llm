import { cn } from '@/lib/utils'

// The dashboard's one tab idiom: text tabs on a hairline, the active one marked
// by an ink underline. Shared by the Keys tabs and the Analytics range toggle;
// ModelsTabs renders the same look with NavLinks for routed tabs. On a narrow
// screen the row scrolls sideways instead of widening the page.
export interface SegmentOption<T extends string> {
  value: T
  label: string
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: {
  value: T
  onValueChange: (value: T) => void
  options: SegmentOption<T>[]
  ariaLabel?: string
  className?: string
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex max-w-full gap-5 overflow-x-auto border-b [&>button]:shrink-0', className)}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onValueChange(o.value)}
          className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-0.5 pb-2.5 pt-1 text-sm transition-colors ${
            value === o.value
              ? 'border-foreground font-medium text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
