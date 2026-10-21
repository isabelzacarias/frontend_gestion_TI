import { useMemo } from "react"

import {
  AttachmentsSection,
  type AttachmentsDataSource,
} from "@/features/attachments/components/AttachmentsSection"
import {
  eliminarEvidenciaMantenimiento,
  listarTodasLasEvidenciasMantenimiento,
  obtenerDescargaEvidenciaMantenimiento,
  subirEvidenciaMantenimiento,
} from "@/features/maintenance/services/mantenimiento-evidencias.service"

interface MaintenanceEvidencesSectionProps {
  mantenimientoId: number
  editable: boolean
}

export function MaintenanceEvidencesSection({
  mantenimientoId,
  editable,
}: MaintenanceEvidencesSectionProps) {
  const dataSource = useMemo<AttachmentsDataSource>(
    () => ({
      listar: () => listarTodasLasEvidenciasMantenimiento(mantenimientoId),
      subir: (archivo, opciones) =>
        subirEvidenciaMantenimiento(mantenimientoId, archivo, opciones),
      descargar: (adjuntoId) =>
        obtenerDescargaEvidenciaMantenimiento(mantenimientoId, adjuntoId),
      eliminar: (adjuntoId) =>
        eliminarEvidenciaMantenimiento(mantenimientoId, adjuntoId),
    }),
    [mantenimientoId],
  )

  return (
    <div className="space-y-2">
      {!editable && (
        <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
          La orden está cerrada. Las evidencias se conservan, pero ya no se
          pueden agregar ni eliminar.
        </p>
      )}
      <AttachmentsSection
        entidadTipo="MANTENIMIENTO"
        entidadId={String(mantenimientoId)}
        dataSource={dataSource}
        puedeSubir={editable}
        puedeEliminar={editable}
      />
    </div>
  )
}
