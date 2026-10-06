import type { ReactNode } from "react"

interface ModuleHeaderProps {
  eyebrow: string
  title: string
  actions?: ReactNode
  filters?: ReactNode
  summary?: ReactNode
  className?: string
}

export function ModuleHeader({
  eyebrow,
  title,
  actions,
  filters,
  summary,
  className = "",
}: ModuleHeaderProps) {
  return (
    <div
      className={`rounded-[30px] border border-white/40 bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.28),transparent_35%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.28),transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.9),_rgba(243,232,255,0.82),_rgba(230,247,255,0.86))] p-4 shadow-[0_22px_70px_rgba(91,36,128,0.12)] backdrop-blur-xl ring-1 ring-white/40 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.28),transparent_35%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.22),transparent_30%),linear-gradient(135deg,_rgba(17,11,28,0.92),_rgba(14,22,36,0.96),_rgba(17,24,39,0.92))] dark:shadow-[0_26px_80px_rgba(13,18,32,0.42)] ${className}`.trim()}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80 dark:text-violet-200 dark:drop-shadow-[0_0_10px_rgba(196,181,253,0.35)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground dark:text-white dark:drop-shadow-[0_0_14px_rgba(255,255,255,0.12)]">
            {title}
          </h1>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {(filters || summary) && (
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {filters ? (
            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
              {filters}
            </div>
          ) : null}

          {summary ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {summary}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
