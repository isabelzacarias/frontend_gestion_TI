import type { FormEvent } from "react"
import {
  Eye,
  EyeOff,
  Pencil,
  Save,
  ShieldAlert,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import PasswordStrengthIndicator from "@/features/passwords/components/PasswordStrengthIndicator"
import type {
  Credential,
  CredentialDraft,
} from "@/features/passwords/types/credential"
import { evaluatePasswordStrength } from "@/features/passwords/utils/password-strength"

interface CredentialDialogProps {
  credential: Credential | undefined
  draft: CredentialDraft | null
  passwordVisible: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onCancel: () => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onDraftChange: (field: keyof CredentialDraft, value: string) => void
  onTogglePassword: () => void
}

interface DetailFieldProps {
  label: string
  value: string
  monospace?: boolean
}

function DetailField({ label, value, monospace = false }: DetailFieldProps) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`break-words text-sm text-foreground ${monospace ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  )
}

function CredentialDialog({
  credential,
  draft,
  passwordVisible,
  onOpenChange,
  onEdit,
  onCancel,
  onSave,
  onDraftChange,
  onTogglePassword,
}: CredentialDialogProps) {
  const strength = evaluatePasswordStrength(draft?.password ?? "")

  return (
    <Dialog open={credential !== undefined} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          draft
            ? "flex max-h-[min(94vh,900px)] w-[min(92vw,1040px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
            : "max-h-[min(92vh,820px)] w-[min(92vw,960px)] max-w-none overflow-y-auto p-0 sm:max-w-none"
        }
      >
        {credential && draft && (
          <>
            <DialogHeader className="border-b border-border px-6 py-6 pr-14 sm:px-8 sm:py-7">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                  <credential.icon aria-hidden="true" className="size-6" />
                </span>
                <div className="min-w-0">
                  <div className="mb-2">
                    <Badge variant="secondary">Edición temporal</Badge>
                  </div>
                  <DialogTitle className="text-xl leading-snug sm:text-2xl">
                    Editar {credential.service}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm leading-6">
                    Los cambios solo estarán en esta sesión y se perderán al
                    recargar.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form
              onSubmit={onSave}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-7 sm:space-y-9 sm:px-8 sm:py-8">
                <section aria-labelledby="credential-general-heading">
                  <div className="mb-5">
                    <h3
                      id="credential-general-heading"
                      className="text-base font-semibold"
                    >
                      Información general
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Identifica el servicio y su categoría.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="credential-service"
                        className="text-sm font-medium sm:text-base"
                      >
                        Servicio
                      </label>
                      <Input
                        id="credential-service"
                        value={draft.service}
                        onChange={(event) =>
                          onDraftChange("service", event.target.value)
                        }
                        required
                        maxLength={80}
                        className="h-12 bg-background px-3.5 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="credential-category"
                        className="text-sm font-medium sm:text-base"
                      >
                        Categoría
                      </label>
                      <Input
                        id="credential-category"
                        value={draft.category}
                        onChange={(event) =>
                          onDraftChange("category", event.target.value)
                        }
                        required
                        maxLength={60}
                        className="h-12 bg-background px-3.5 text-base"
                      />
                    </div>
                  </div>
                </section>

                <section
                  aria-labelledby="credential-access-heading"
                  className="border-t border-border pt-7"
                >
                  <div className="mb-5">
                    <h3
                      id="credential-access-heading"
                      className="text-base font-semibold"
                    >
                      Datos de acceso
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Solo para demostración: no introduzcas contraseñas reales.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="credential-account"
                        className="text-sm font-medium sm:text-base"
                      >
                        Cuenta / correo
                      </label>
                      <Input
                        id="credential-account"
                        value={draft.account}
                        onChange={(event) =>
                          onDraftChange("account", event.target.value)
                        }
                        required
                        maxLength={120}
                        autoComplete="off"
                        className="h-12 bg-background px-3.5 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="credential-username"
                        className="text-sm font-medium sm:text-base"
                      >
                        Nombre de usuario
                      </label>
                      <Input
                        id="credential-username"
                        value={draft.username}
                        onChange={(event) =>
                          onDraftChange("username", event.target.value)
                        }
                        required
                        maxLength={80}
                        autoComplete="off"
                        className="h-12 bg-background px-3.5 text-base"
                      />
                    </div>
                    <div className="space-y-3 sm:col-span-2">
                      <label
                        htmlFor="credential-password"
                        className="text-sm font-medium sm:text-base"
                      >
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <Input
                          id="credential-password"
                          type={passwordVisible ? "text" : "password"}
                          value={draft.password}
                          onChange={(event) =>
                            onDraftChange("password", event.target.value)
                          }
                          required
                          maxLength={128}
                          autoComplete="new-password"
                          aria-describedby="password-strength-help"
                          className="h-12 bg-background pr-12 pl-3.5 font-mono text-base"
                        />
                        <button
                          type="button"
                          className="absolute top-1/2 right-1.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={
                            passwordVisible
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          aria-pressed={passwordVisible}
                          onClick={onTogglePassword}
                        >
                          {passwordVisible ? (
                            <EyeOff aria-hidden="true" className="size-4" />
                          ) : (
                            <Eye aria-hidden="true" className="size-4" />
                          )}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={draft.password} />
                      {!strength.isStrong && (
                        <p className="text-xs text-muted-foreground">
                          Completa los requisitos para habilitar el guardado.
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor="credential-website"
                        className="text-sm font-medium sm:text-base"
                      >
                        Sitio web
                      </label>
                      <Input
                        id="credential-website"
                        type="url"
                        value={draft.website}
                        onChange={(event) =>
                          onDraftChange("website", event.target.value)
                        }
                        required
                        maxLength={200}
                        autoComplete="url"
                        className="h-12 bg-background px-3.5 text-base"
                      />
                    </div>
                  </div>
                </section>

                <section
                  aria-labelledby="credential-notes-heading"
                  className="border-t border-border pt-7"
                >
                  <h3
                    id="credential-notes-heading"
                    className="mb-4 text-base font-semibold"
                  >
                    Notas
                  </h3>
                  <Textarea
                    id="credential-notes"
                    aria-label="Notas de la credencial"
                    value={draft.notes}
                    onChange={(event) =>
                      onDraftChange("notes", event.target.value)
                    }
                    maxLength={500}
                    rows={4}
                    className="bg-background px-3.5 py-3 text-base"
                  />
                </section>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/25 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-5"
                  onClick={onCancel}
                >
                  <X aria-hidden="true" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-5"
                  disabled={!strength.isStrong}
                >
                  <Save aria-hidden="true" />
                  Guardar cambios
                </Button>
              </div>
            </form>
          </>
        )}

        {credential && !draft && (
          <>
            <DialogHeader className="border-b border-border px-6 py-6 pr-14 sm:px-8 sm:py-7">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
                  <credential.icon aria-hidden="true" className="size-6" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-xl sm:text-2xl">
                    {credential.service}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm leading-6">
                    Detalle de la credencial de ejemplo
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8 px-6 py-7 sm:space-y-9 sm:px-8 sm:py-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="px-3 py-1.5 text-sm">
                  {credential.category}
                </Badge>
                <Badge
                  variant="secondary"
                  className="px-3 py-1.5 text-sm font-normal"
                >
                  Registro de ejemplo
                </Badge>
              </div>

              <section aria-labelledby="credential-detail-access">
                <h3
                  id="credential-detail-access"
                  className="mb-5 text-base font-semibold"
                >
                  Datos de acceso
                </h3>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <DetailField label="Cuenta / correo" value={credential.account} />
                  <DetailField
                    label="Nombre de usuario"
                    value={credential.username}
                    monospace
                  />
                  <div className="min-w-0 space-y-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Contraseña
                    </dt>
                    <dd className="flex min-w-0 items-center gap-3">
                      <span className="min-w-0 break-all font-mono text-base text-foreground">
                        {passwordVisible ? credential.password : "••••••••••••"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-11 shrink-0"
                        aria-label={
                          passwordVisible
                            ? "Ocultar contraseña de ejemplo"
                            : "Mostrar contraseña de ejemplo"
                        }
                        aria-pressed={passwordVisible}
                        onClick={onTogglePassword}
                      >
                        {passwordVisible ? (
                          <EyeOff aria-hidden="true" />
                        ) : (
                          <Eye aria-hidden="true" />
                        )}
                      </Button>
                    </dd>
                  </div>
                  <DetailField
                    label="Sitio web"
                    value={credential.website}
                    monospace
                  />
                </dl>
              </section>

              <section
                aria-labelledby="credential-detail-record"
                className="border-t border-border pt-7"
              >
                <h3
                  id="credential-detail-record"
                  className="mb-5 text-base font-semibold"
                >
                  Registro
                </h3>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <DetailField label="Guardada por" value={credential.createdBy} />
                  <DetailField
                    label="Última actualización"
                    value={credential.updatedAt}
                  />
                  <div className="space-y-2 sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Notas
                    </dt>
                    <dd className="max-w-prose text-base leading-7 text-foreground">
                      {credential.notes}
                    </dd>
                  </div>
                </dl>
              </section>

              <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-4 py-4">
                <ShieldAlert
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                />
                <p className="text-sm leading-6 text-muted-foreground">
                  Esta vista es provisional. Los datos son ficticios y los campos
                  podrían cambiar al definir el formato final.
                </p>
              </div>

              <div className="-mx-6 -mb-7 flex justify-end border-t border-border bg-muted/25 px-6 py-5 sm:-mx-8 sm:-mb-8 sm:px-8">
                <Button type="button" className="h-11 px-5" onClick={onEdit}>
                  <Pencil aria-hidden="true" />
                  Editar credencial
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CredentialDialog
