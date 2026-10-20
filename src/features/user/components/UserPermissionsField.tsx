import { ShieldMinus, ShieldPlus } from "lucide-react"

import { MultiSelect } from "@/components/ui/multi-select"
import { PERMISO_OPTIONS } from "@/features/user/data/permissions"

export interface UserPermissionsValue {
  extra: string[]
  revocados: string[]
}

interface UserPermissionsFieldProps {
  value: UserPermissionsValue
  onChange: (value: UserPermissionsValue) => void
  disabled?: boolean
}

export function UserPermissionsField({
  value,
  onChange,
  disabled = false,
}: UserPermissionsFieldProps) {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldPlus aria-hidden="true" className="size-3.5" />
            Permisos adicionales (conceder)
          </p>
          <MultiSelect
            options={PERMISO_OPTIONS}
            values={value.extra}
            excludedValues={value.revocados}
            excludedHint="Ya revocado"
            onChange={(extra) =>
              onChange({
                extra,
                revocados: value.revocados.filter(
                  (permiso) => !extra.includes(permiso),
                ),
              })
            }
            placeholder="Sin permisos adicionales"
            searchPlaceholder="Buscar permiso..."
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
            <ShieldMinus aria-hidden="true" className="size-3.5" />
            Permisos revocados (quitar del rol)
          </p>
          <MultiSelect
            options={PERMISO_OPTIONS}
            values={value.revocados}
            excludedValues={value.extra}
            excludedHint="Ya concedido"
            onChange={(revocados) =>
              onChange({
                extra: value.extra.filter(
                  (permiso) => !revocados.includes(permiso),
                ),
                revocados,
              })
            }
            placeholder="Sin permisos revocados"
            searchPlaceholder="Buscar permiso..."
            disabled={disabled}
          />
        </div>
      </div>

      <p className="text-[11px] leading-4 text-muted-foreground">
        El acceso efectivo del usuario es: permisos del rol + adicionales −
        revocados. El backend aplica estas excepciones de forma incremental
        (conceder o revocar); un permiso ya concedido o revocado no se puede
        restablecer al valor del rol.
      </p>
    </div>
  )
}
