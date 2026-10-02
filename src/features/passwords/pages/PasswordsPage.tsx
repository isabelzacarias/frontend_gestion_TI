import { useState } from "react"
import {
  Building2,
  Cloud,
  Code2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
} from "lucide-react"

import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CredentialExample {
  service: string
  account: string
  username: string
  password: string
  website: string
  category: string
  updatedAt: string
  createdBy: string
  notes: string
  icon: typeof Building2
}

const credentialExamples: CredentialExample[] = [
  {
    service: "Portal interno",
    account: "soporte@empresa.test",
    username: "soporte-ti",
    password: "Demo-Portal-2026!",
    website: "https://portal.empresa.test",
    category: "Corporativo",
    updatedAt: "24 sep 2026",
    createdBy: "Equipo de soporte",
    notes: "Acceso de demostración para el portal de soporte interno.",
    icon: Building2,
  },
  {
    service: "GitHub",
    account: "dev-ti@empresa.test",
    username: "dev-ti-demo",
    password: "Demo-Git-2026!",
    website: "https://github.com",
    category: "Desarrollo",
    updatedAt: "18 sep 2026",
    createdBy: "Equipo de desarrollo",
    notes: "Cuenta de ejemplo para repositorios de prueba.",
    icon: Code2,
  },
  {
    service: "Nube de respaldo",
    account: "infraestructura@empresa.test",
    username: "infra-backup-demo",
    password: "Demo-Cloud-2026!",
    website: "https://nube.empresa.test",
    category: "Infraestructura",
    updatedAt: "12 sep 2026",
    createdBy: "Equipo de infraestructura",
    notes: "Acceso de demostración al entorno de respaldos.",
    icon: Cloud,
  },
  {
    service: "Base de datos de pruebas",
    account: "admin-pruebas@empresa.test",
    username: "admin-pruebas",
    password: "Demo-DB-2026!",
    website: "https://db-pruebas.empresa.test",
    category: "Base de datos",
    updatedAt: "03 sep 2026",
    createdBy: "Equipo de base de datos",
    notes: "Credencial ficticia para una base de datos de pruebas.",
    icon: Database,
  },
]

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

function PasswordsPage() {
  const [selectedCredential, setSelectedCredential] =
    useState<CredentialExample | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)

  function closeDetails(open: boolean) {
    if (!open) {
      setSelectedCredential(null)
      setPasswordVisible(false)
    }
  }

  return (
    <PagePlaceholder
      title="Contraseñas"
      description="Consulta las credenciales guardadas para los servicios de TI."
    >
      <section aria-label="Ejemplo de credenciales" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 rounded-md px-2.5 py-1">
            <KeyRound aria-hidden="true" />
            Ejemplo visual
          </Badge>
          <span className="text-sm text-muted-foreground">
            Datos ficticios; esta vista no está conectada a la API.
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-start gap-3 border-b border-border bg-muted/40 px-4 py-3.5 sm:px-5">
            <ShieldAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <p className="text-sm leading-5 text-muted-foreground">
              Las contraseñas se muestran ocultas. Las cuentas con dominio
              <span className="font-medium text-foreground"> .test </span>
              son ejemplos y no corresponden a usuarios reales.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Ejemplos ficticios de credenciales almacenadas
              </caption>
              <thead className="bg-background text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th scope="col" className="px-5 py-3.5">
                    Servicio
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Cuenta
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Categoría
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Contraseña
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Última actualización
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {credentialExamples.map((credential) => {
                  const {
                    service,
                    account,
                    category,
                    updatedAt,
                    icon: Icon,
                  } = credential

                  return (
                    <tr
                      key={service}
                      className="transition-colors hover:bg-muted/35"
                    >
                      <th
                        scope="row"
                        className="whitespace-nowrap px-5 py-4 font-medium text-foreground"
                      >
                        <button
                          type="button"
                          className="flex items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-haspopup="dialog"
                          onClick={() => {
                            setSelectedCredential(credential)
                            setPasswordVisible(false)
                          }}
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon aria-hidden="true" className="size-4" />
                          </span>
                          <span className="underline-offset-4 hover:underline">
                            {service}
                          </span>
                        </button>
                      </th>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {account}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <Badge variant="outline" className="font-normal">
                          {category}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-muted-foreground">
                        <span aria-label="Contraseña oculta">••••••••••••</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {updatedAt}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Mostrando {credentialExamples.length} registros de ejemplo
            </p>
          </div>
        </div>

        <Dialog
          open={selectedCredential !== null}
          onOpenChange={closeDetails}
        >
          <DialogContent className="max-h-[min(90vh,760px)] max-w-xl overflow-y-auto p-0">
            {selectedCredential && (
              <>
                <DialogHeader className="border-b border-border px-5 py-5 pr-12 sm:px-6">
                  <div className="mb-1 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <selectedCredential.icon
                        aria-hidden="true"
                        className="size-5"
                      />
                    </span>
                    <div className="min-w-0">
                      <DialogTitle className="text-lg">
                        {selectedCredential.service}
                      </DialogTitle>
                      <DialogDescription className="mt-1">
                        Detalle de la credencial de ejemplo
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                  <Badge variant="outline">
                    {selectedCredential.category}
                  </Badge>

                  <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                    <DetailField
                      label="Cuenta / correo"
                      value={selectedCredential.account}
                    />
                    <DetailField
                      label="Nombre de usuario"
                      value={selectedCredential.username}
                      monospace
                    />
                    <div className="min-w-0 space-y-1">
                      <dt className="text-xs font-medium text-muted-foreground">
                        Contraseña de ejemplo
                      </dt>
                      <dd className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 break-all font-mono text-sm text-foreground">
                          {passwordVisible
                            ? selectedCredential.password
                            : "••••••••••••"}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          aria-label={
                            passwordVisible
                              ? "Ocultar contraseña de ejemplo"
                              : "Mostrar contraseña de ejemplo"
                          }
                          aria-pressed={passwordVisible}
                          onClick={() => setPasswordVisible((visible) => !visible)}
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
                      value={selectedCredential.website}
                    />
                    <DetailField
                      label="Guardada por"
                      value={selectedCredential.createdBy}
                    />
                    <DetailField
                      label="Última actualización"
                      value={selectedCredential.updatedAt}
                    />
                    <div className="space-y-1 sm:col-span-2">
                      <dt className="text-xs font-medium text-muted-foreground">
                        Notas
                      </dt>
                      <dd className="text-sm leading-6 text-foreground">
                        {selectedCredential.notes}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                    <ShieldAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      eSTA VISTA ES PROVICIONAL AUN NO SABEMOS QUE DATOS SE PODRIAN ACOMODAR AQUI.
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </PagePlaceholder>
  )
}

export default PasswordsPage
