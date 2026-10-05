import type { FormEvent, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

/* ──────────────────────────────────────────────
 * Estilos compartidos — extraídos de AssetFormDialog
 * ────────────────────────────────────────────── */
const sectionClass =
  "rounded-2xl border border-white/50 bg-white/50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/35"
const sectionTitleClass =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80"
const fieldClass = "space-y-1.5"
const labelClass = "text-[11px] font-medium text-foreground"
const inputClass =
  "h-8 w-full border-white/70 bg-white/80 text-[13px] text-foreground shadow-sm placeholder:text-muted-foreground/80 dark:border-white/10 dark:bg-slate-900/55"
const selectClass =
  "h-8 w-full rounded-xl border border-white/70 bg-white/80 px-3 text-[13px] text-foreground shadow-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-slate-900/55"
const textareaClass =
  "w-full rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-[13px] text-foreground shadow-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-slate-900/55 resize-none"

/* ──────────────────────────────────────────────
 * Tipos públicos
 * ────────────────────────────────────────────── */

/** Colores predefinidos para el bullet de cada sección */
type SectionColor = "primary" | "cyan" | "violet" | "emerald" | "amber" | "rose"

const sectionColorMap: Record<SectionColor, string> = {
  primary: "bg-primary",
  cyan: "bg-cyan-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
}

/** Opción de select */
export interface SelectOption {
  value: string
  label: string
}

/** Campo de formulario */
export interface FormField<T> {
  /** Clave del campo en el objeto draft */
  key: keyof T & string
  /** Etiqueta visible */
  label: string
  /** Tipo de campo — por defecto "text" */
  type?: "text" | "email" | "number" | "tel" | "url" | "password" | "select" | "textarea"
  /** Placeholder del input */
  placeholder?: string
  /** Si es "select", las opciones disponibles */
  options?: SelectOption[]
  /** Número de filas si es textarea — por defecto 3 */
  rows?: number
  /** Clases extra para el wrapper (ej: "sm:col-span-2") */
  colSpan?: string
  /** Si el campo es requerido */
  required?: boolean
}

/** Sección agrupadora de campos */
export interface FormSection<T> {
  /** Título de la sección */
  title: string
  /** Color del bullet */
  color?: SectionColor
  /** Disposición de columnas — ej: "sm:grid-cols-3" */
  gridCols?: string
  /** Campos que contiene la sección */
  fields: FormField<T>[]
}

/** Props del FormDialog genérico */
export interface FormDialogProps<T extends Record<string, unknown>> {
  /** Título del dialog */
  title: string
  /** Descripción bajo el título */
  description: string
  /** Texto del botón de submit — por defecto "Guardar" */
  submitLabel?: string
  /** Texto del botón de cancelar — por defecto "Cancelar" */
  cancelLabel?: string
  /** Icono o carácter dentro del badge del header — por defecto "+" */
  icon?: ReactNode
  /** Si el dialog está abierto */
  open: boolean
  /** El objeto borrador con los valores actuales */
  draft: T
  /** Callback para abrir/cerrar el dialog */
  onOpenChange: (open: boolean) => void
  /** Callback cuando cambia un campo */
  onChange: <K extends keyof T>(field: K, value: T[K]) => void
  /** Callback al enviar el formulario */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  /** Definición de las secciones y sus campos */
  sections: FormSection<T>[]
}

/* ──────────────────────────────────────────────
 * Componente
 * ────────────────────────────────────────────── */
export function FormDialog<T extends Record<string, unknown>>({
  title,
  description,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  icon = <span className="text-lg font-bold">+</span>,
  open,
  draft,
  onOpenChange,
  onChange,
  onSubmit,
  sections,
}: FormDialogProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,760px)] w-[min(86vw,980px)] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] border border-white/50 bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.22),transparent_32%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.18),transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(245,237,255,0.9),_rgba(233,248,255,0.88))] p-0 shadow-[0_30px_90px_rgba(91,36,128,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.28),transparent_32%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.2),transparent_30%),linear-gradient(135deg,_rgba(17,11,28,0.97),_rgba(15,23,42,0.97),_rgba(17,24,39,0.95))] sm:max-w-none">
        {/* ─── Header ─── */}
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/80 px-6 pb-4 pt-5 sm:px-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--primary-600),var(--primary-500),var(--secondary-500))]" />
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)]">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ─── Form body ─── */}
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {sections.map((section) => (
              <section key={section.title} className={sectionClass}>
                <div className="mb-2.5 flex items-center gap-2">
                  <div
                    className={`size-2 rounded-full ${sectionColorMap[section.color ?? "primary"]}`}
                  />
                  <h3 className={sectionTitleClass}>{section.title}</h3>
                </div>

                <div
                  className={`grid gap-x-4 gap-y-2.5 ${section.gridCols ?? "sm:grid-cols-2"}`}
                >
                  {section.fields.map((field) => (
                    <div
                      key={field.key}
                      className={`${fieldClass} ${field.colSpan ?? ""}`}
                    >
                      <label htmlFor={field.key} className={labelClass}>
                        {field.label}
                      </label>

                      {field.type === "select" ? (
                        <select
                          id={field.key}
                          value={draft[field.key] as string}
                          onChange={(e) =>
                            onChange(field.key, e.target.value as T[keyof T])
                          }
                          required={field.required}
                          className={selectClass}
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          id={field.key}
                          value={draft[field.key] as string}
                          onChange={(e) =>
                            onChange(field.key, e.target.value as T[keyof T])
                          }
                          placeholder={field.placeholder}
                          required={field.required}
                          rows={field.rows ?? 3}
                          className={textareaClass}
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type ?? "text"}
                          value={draft[field.key] as string}
                          onChange={(e) =>
                            onChange(field.key, e.target.value as T[keyof T])
                          }
                          placeholder={field.placeholder}
                          required={field.required}
                          className={inputClass}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* ─── Footer ─── */}
          <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border/80 bg-transparent p-0">
            <div className="flex w-full justify-end gap-2 px-5 py-4 sm:gap-2.5 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 rounded-xl border border-white/70 bg-white/70 px-3 text-xs font-semibold shadow-sm hover:bg-white/90 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
              >
                {cancelLabel}
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-3 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)] hover:brightness-110"
              >
                {submitLabel}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
