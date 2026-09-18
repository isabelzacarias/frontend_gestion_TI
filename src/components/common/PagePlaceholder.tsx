import type { ReactNode } from "react"

interface PagePlaceholderProps {
  title: string
  description: string
  children?: ReactNode
}

function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <section className="flex flex-1 flex-col gap-4">
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
