/**
 * Línea visual animada que indica la posición de inserción
 * mientras el usuario arrastra un ticket.
 */
export function DropIndicator() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex animate-in fade-in items-center gap-1.5 duration-100"
    >
      <span className="size-2 shrink-0 rounded-full bg-primary" />
      <span className="h-0.5 flex-1 rounded-full bg-primary" />
      <span className="size-2 shrink-0 rounded-full bg-primary" />
    </div>
  )
}
