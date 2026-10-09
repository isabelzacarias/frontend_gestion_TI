import { Link } from "react-router"
import { ArrowUpRight } from "lucide-react"

interface KpiCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: React.ReactNode
  accentColor?: "primary" | "cyan" | "emerald"
  to?: string
  badgeText?: string
  loading?: boolean
}

const colorStyles = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    hoverBorder: "hover:border-primary/40",
    badge: "bg-primary/10 text-primary border-primary/20",
    glow: "bg-primary/10",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/40",
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    glow: "bg-cyan-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    glow: "bg-emerald-500/10",
  },
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accentColor = "primary",
  to,
  badgeText,
  loading = false,
}: KpiCardProps) {
  const styles = colorStyles[accentColor]

  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-card/60 ${styles.hoverBorder}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${styles.bg} ${styles.text} ${styles.border}`}
          >
            {icon}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            {badgeText && (
              <span
                className={`ml-2 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${styles.badge}`}
              >
                {badgeText}
              </span>
            )}
          </div>
        </div>

        {to && (
          <div className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors group-hover:bg-primary/[0.06] group-hover:text-primary">
            <ArrowUpRight className="size-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {value}
            </span>
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )

  if (to) {
    return <Link to={to} className="block">{content}</Link>
  }

  return content
}
