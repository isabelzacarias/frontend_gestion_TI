import {
  esCadena,
  isRecord,
  textoValor,
} from "@/features/audit/utils/audit-detail-format"

const boxClass =
  "rounded-xl border border-border/70 bg-background/60 px-3 py-2"
const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
const chipClass =
  "rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[11px] text-violet-700 dark:text-violet-400"

function ValorDetalle({ value }: { value: unknown }) {
  if (typeof value === "object" && value !== null) {
    return (
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-foreground/90">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return (
    <span className="break-words font-mono text-xs text-foreground/90">
      {textoValor(value)}
    </span>
  )
}

export function AuditDetailView({ detalle }: { detalle: unknown }) {
  if (detalle === null || detalle === undefined) {
    return (
      <span className="text-xs italic text-muted-foreground">
        Sin detalle adicional.
      </span>
    )
  }

  if (!isRecord(detalle)) {
    return <ValorDetalle value={detalle} />
  }

  const campos = Array.isArray(detalle.campos)
    ? detalle.campos.filter(esCadena)
    : []
  const resumen = isRecord(detalle.resumen) ? detalle.resumen : null
  const otrasClaves = Object.entries(detalle).filter(
    ([clave]) => clave !== "campos" && clave !== "resumen",
  )

  const tieneContenido =
    campos.length > 0 ||
    (resumen !== null && Object.keys(resumen).length > 0) ||
    otrasClaves.length > 0

  if (!tieneContenido) {
    return <ValorDetalle value={detalle} />
  }

  return (
    <div className="space-y-3">
      {campos.length > 0 && (
        <div>
          <p className={labelClass}>Campos modificados</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {campos.map((campo) => (
              <span key={campo} className={chipClass}>
                {campo}
              </span>
            ))}
          </div>
        </div>
      )}

      {resumen !== null && Object.keys(resumen).length > 0 && (
        <div>
          <p className={labelClass}>Resumen</p>
          <div className="mt-1.5 space-y-2">
            {Object.entries(resumen).map(([clave, valor]) => (
              <div key={clave} className={boxClass}>
                <p className={labelClass}>{clave}</p>
                <div className="mt-1">
                  <ValorDetalle value={valor} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {otrasClaves.length > 0 && (
        <div>
          <p className={labelClass}>Metadatos</p>
          <div className="mt-1.5 space-y-2">
            {otrasClaves.map(([clave, valor]) => (
              <div key={clave} className={boxClass}>
                <p className={labelClass}>{clave}</p>
                <div className="mt-1">
                  <ValorDetalle value={valor} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
