import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PagePlaceholderProps {
  title: string
  description: string
  children?: ReactNode
  className?: string
}

function PagePlaceholder({ title, description, children, className }: PagePlaceholderProps) {
  return (
    <section className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto", className)}>
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  )
}

export { PagePlaceholder }
