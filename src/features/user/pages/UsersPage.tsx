import { useEffect, useMemo, useState } from "react"
import {
  Briefcase,
  Building2,
  CircleDot,
  Download,
  MapPin,
  Search,
  ShieldCheck,
  Tag,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetOption,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import { UserDetailDialog } from "@/features/user/components/UserDetailDialog"
import { exportUsuariosToCsv } from "@/features/user/utils/user-export"
import { catalogoNombre, formatearFecha } from "@/features/user/utils/user-format"
import {
  UsuarioApiError,
  listarTodosLosUsuarios,
} from "@/services/usuario.service"
import type {
  ResumenCatalogo,
  ResumenRol,
  UsuarioLista,
} from "@/services/usuario.service"

const ITEMS_PER_PAGE = 10

function mensajeDeError(error: unknown): string {
  if (error instanceof UsuarioApiError) {
    if (error.status === 403) {
      return "No tienes permiso para consultar usuarios (usuarios:administrar)."
    }
    return error.message
  }
  return "No se pudo completar la operación."
}

type SelectorCatalogo = (
  usuario: UsuarioLista,
) => ResumenCatalogo | ResumenRol | null

function opcionesDesdeDatos(
  usuarios: UsuarioLista[],
  selector: SelectorCatalogo,
): FacetOption[] {
  const vistos = new Map<number, string>()
  usuarios.forEach((usuario) => {
    const catalogo = selector(usuario)
    if (catalogo) vistos.set(catalogo.id, catalogo.nombre)
  })
  return [...vistos.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .map(([id, nombre]) => ({ value: String(id), label: nombre }))
}

function UsersPage() {
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [searchTexto, setSearchTexto] = useState("")
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string[]>([])
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string[]>([])
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<
    string[]
  >([])
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string[]>(
    [],
  )
  const [puestoSeleccionado, setPuestoSeleccionado] = useState<string[]>([])
  const [rolSeleccionado, setRolSeleccionado] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function cargarUsuarios() {
      setIsLoading(true)

      try {
        const lista = await listarTodosLosUsuarios()
        if (cancelado) return
        setUsuarios(lista)
      } catch (error) {
        if (cancelado) return
        toast.error(mensajeDeError(error))
        setUsuarios([])
      } finally {
        if (!cancelado) setIsLoading(false)
      }
    }

    void cargarUsuarios()

    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchTexto(search.trim())
      setCurrentPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  const selectedUsuario = useMemo(
    () => usuarios.find((usuario) => usuario.id === selectedUsuarioId) ?? null,
    [usuarios, selectedUsuarioId],
  )

  const tipoOptions = useMemo(
    () => opcionesDesdeDatos(usuarios, (usuario) => usuario.tipoUsuario),
    [usuarios],
  )
  const departamentoOptions = useMemo(
    () => opcionesDesdeDatos(usuarios, (usuario) => usuario.departamento),
    [usuarios],
  )
  const ubicacionOptions = useMemo(
    () => opcionesDesdeDatos(usuarios, (usuario) => usuario.ubicacion),
    [usuarios],
  )
  const puestoOptions = useMemo(
    () => opcionesDesdeDatos(usuarios, (usuario) => usuario.puesto),
    [usuarios],
  )
  const rolOptions = useMemo(
    () => opcionesDesdeDatos(usuarios, (usuario) => usuario.rol),
    [usuarios],
  )

  const filteredUsuarios = useMemo(() => {
    const termino = searchTexto.toLowerCase()

    return usuarios.filter((usuario) => {
      if (
        estadoSeleccionado.length > 0 &&
        !estadoSeleccionado.includes(String(usuario.activo))
      ) {
        return false
      }

      if (
        tipoSeleccionado.length > 0 &&
        !tipoSeleccionado.includes(String(usuario.tipoUsuario?.id ?? ""))
      ) {
        return false
      }

      if (
        departamentoSeleccionado.length > 0 &&
        !departamentoSeleccionado.includes(String(usuario.departamento?.id ?? ""))
      ) {
        return false
      }

      if (
        ubicacionSeleccionada.length > 0 &&
        !ubicacionSeleccionada.includes(String(usuario.ubicacion?.id ?? ""))
      ) {
        return false
      }

      if (
        puestoSeleccionado.length > 0 &&
        !puestoSeleccionado.includes(String(usuario.puesto?.id ?? ""))
      ) {
        return false
      }

      if (
        rolSeleccionado.length > 0 &&
        !rolSeleccionado.includes(String(usuario.rol?.id ?? ""))
      ) {
        return false
      }

      if (termino) {
        const coincide = [
          usuario.id,
          usuario.nombre,
          usuario.email ?? "",
          usuario.departamento?.nombre ?? "",
          usuario.ubicacion?.nombre ?? "",
          usuario.puesto?.nombre ?? "",
          usuario.tipoUsuario?.nombre ?? "",
          usuario.rol?.nombre ?? "",
        ].some((valor) => valor.toLowerCase().includes(termino))

        if (!coincide) return false
      }

      return true
    })
  }, [
    usuarios,
    searchTexto,
    estadoSeleccionado,
    tipoSeleccionado,
    departamentoSeleccionado,
    ubicacionSeleccionada,
    puestoSeleccionado,
    rolSeleccionado,
  ])

  const hayFiltros =
    searchTexto !== "" ||
    estadoSeleccionado.length > 0 ||
    tipoSeleccionado.length > 0 ||
    departamentoSeleccionado.length > 0 ||
    ubicacionSeleccionada.length > 0 ||
    puestoSeleccionado.length > 0 ||
    rolSeleccionado.length > 0

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "estado",
        label: "Estado",
        icon: CircleDot,
        options: [
          { value: "true", label: "Activas" },
          { value: "false", label: "Inactivas" },
        ],
      },
      { id: "tipoUsuario", label: "Tipo de usuario", icon: Tag, options: tipoOptions },
      {
        id: "departamento",
        label: "Departamento",
        icon: Building2,
        options: departamentoOptions,
      },
      {
        id: "ubicacion",
        label: "Ubicación",
        icon: MapPin,
        options: ubicacionOptions,
      },
      { id: "puesto", label: "Puesto", icon: Briefcase, options: puestoOptions },
      { id: "rol", label: "Rol", icon: ShieldCheck, options: rolOptions },
    ],
    [
      tipoOptions,
      departamentoOptions,
      ubicacionOptions,
      puestoOptions,
      rolOptions,
    ],
  )

  const facetSelecciones = useMemo<FacetSelections>(
    () => ({
      estado: estadoSeleccionado,
      tipoUsuario: tipoSeleccionado,
      departamento: departamentoSeleccionado,
      ubicacion: ubicacionSeleccionada,
      puesto: puestoSeleccionado,
      rol: rolSeleccionado,
    }),
    [
      estadoSeleccionado,
      tipoSeleccionado,
      departamentoSeleccionado,
      ubicacionSeleccionada,
      puestoSeleccionado,
      rolSeleccionado,
    ],
  )

  function handleFacetChange(dimensionId: string, values: string[]) {
    if (dimensionId === "estado") setEstadoSeleccionado(values)
    else if (dimensionId === "tipoUsuario") setTipoSeleccionado(values)
    else if (dimensionId === "departamento") setDepartamentoSeleccionado(values)
    else if (dimensionId === "ubicacion") setUbicacionSeleccionada(values)
    else if (dimensionId === "puesto") setPuestoSeleccionado(values)
    else if (dimensionId === "rol") setRolSeleccionado(values)
    setCurrentPage(1)
  }

  function borrarFacetas() {
    setEstadoSeleccionado([])
    setTipoSeleccionado([])
    setDepartamentoSeleccionado([])
    setUbicacionSeleccionada([])
    setPuestoSeleccionado([])
    setRolSeleccionado([])
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    setSearchTexto("")
    borrarFacetas()
  }

  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedUsuarios = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredUsuarios.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredUsuarios, activePage])

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  const columns: DataTableColumn<UsuarioLista>[] = [
    {
      key: "id",
      header: "ID",
      cellClassName:
        "border-b border-border/70 px-4 py-3 font-mono text-xs font-semibold text-foreground",
      render: (usuario) => usuario.id,
    },
    {
      key: "nombre",
      header: "Nombre",
      cellClassName: "border-b border-border/70 px-4 py-3 font-semibold text-foreground",
      render: (usuario) => usuario.nombre,
    },
    {
      key: "email",
      header: "Correo",
      cellClassName:
        "border-b border-border/70 px-4 py-3 text-sm text-muted-foreground",
      render: (usuario) => usuario.email ?? "—",
    },
    {
      key: "departamento",
      header: "Departamento",
      cellClassName: "border-b border-border/70 px-4 py-3 text-sm text-foreground/90",
      render: (usuario) => catalogoNombre(usuario.departamento),
    },
    {
      key: "ubicacion",
      header: "Ubicación",
      cellClassName: "border-b border-border/70 px-4 py-3 text-sm text-foreground/90",
      render: (usuario) => catalogoNombre(usuario.ubicacion),
    },
    {
      key: "puesto",
      header: "Puesto",
      cellClassName: "border-b border-border/70 px-4 py-3 text-sm text-foreground/90",
      render: (usuario) => catalogoNombre(usuario.puesto),
    },
    {
      key: "tipoUsuario",
      header: "Tipo",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (usuario) =>
        usuario.tipoUsuario ? (
          <Badge variant="outline" className="px-2.5 py-1 text-sm font-medium">
            {usuario.tipoUsuario.nombre}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "rol",
      header: "Rol",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (usuario) =>
        usuario.rol ? (
          <Badge
            variant="outline"
            className="border-violet-300 bg-violet-50 px-2.5 py-1 text-sm font-medium text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200"
          >
            {usuario.rol.nombre}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "activo",
      header: "Estado",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (usuario) =>
        usuario.activo ? (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400">
            Activa
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-slate-400/30 bg-slate-400/10 font-medium text-slate-600 dark:text-slate-400"
          >
            Inactiva
          </Badge>
        ),
    },
    {
      key: "fechaInicio",
      header: "Inicio",
      cellClassName: "border-b border-border/70 px-4 py-3 text-sm text-foreground/90",
      render: (usuario) => formatearFecha(usuario.fechaInicio),
    },
    {
      key: "fechaFin",
      header: "Fin",
      cellClassName: "border-b border-border/70 px-4 py-3 text-sm text-foreground/90",
      render: (usuario) => formatearFecha(usuario.fechaFin),
    },
  ]

  function openDetail(usuario: UsuarioLista) {
    setSelectedUsuarioId(usuario.id)
    setIsDetailOpen(true)
  }

  function handleExport() {
    if (filteredUsuarios.length === 0) {
      toast.info("No hay usuarios para exportar con los filtros actuales.")
      return
    }

    exportUsuariosToCsv(filteredUsuarios)
    toast.success(`${filteredUsuarios.length} usuario(s) exportados a CSV.`)
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Administración TI"
        title="Usuarios"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.05)] backdrop-blur-md hover:bg-white/90 dark:border-violet-400/30 dark:bg-slate-900/70 dark:text-violet-100 dark:hover:bg-slate-800/90"
            >
              <Download className="size-4" />
              Exportar
            </Button>
          </div>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por ID, nombre, correo, área o puesto..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <FacetedFilter
              dimensions={facetDimensions}
              selections={facetSelecciones}
              onChange={handleFacetChange}
              onClearAll={borrarFacetas}
            />

            {hayFiltros && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="text-muted-foreground"
              >
                <X />
                Borrar filtros
              </Button>
            )}
          </div>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <Users className="size-3.5 text-violet-700 dark:text-violet-200" />
            {hayFiltros
              ? `${filteredUsuarios.length} de ${usuarios.length} usuarios`
              : `${filteredUsuarios.length} usuarios registrados`}
          </span>
        }
      />

      <DataTable<UsuarioLista>
        columns={columns}
        data={paginatedUsuarios}
        rowKey={(usuario) => usuario.id}
        page={activePage}
        totalPages={totalPages}
        totalFiltered={filteredUsuarios.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        onRowClick={(usuario) => setSelectedUsuarioId(usuario.id)}
        onRowDoubleClick={openDetail}
        selectedRowKey={selectedUsuarioId}
        emptyMessage={
          isLoading
            ? "Cargando usuarios..."
            : "No se encontraron usuarios con los criterios seleccionados."
        }
      />

      <UserDetailDialog
        usuario={selectedUsuario}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}

export default UsersPage
