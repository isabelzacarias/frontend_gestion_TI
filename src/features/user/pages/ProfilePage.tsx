import { useAuthStore } from "@/store/authStore"

function ProfilePage() {
  const usuario = useAuthStore((state) => state.usuario)

  if (!usuario) return null

  const campos = [
    { label: "Nombre", valor: usuario.nombre },
    { label: "Correo electrónico", valor: usuario.email },
    { label: "Rol", valor: usuario.rol ?? "Sin rol asignado" },
    {
      label: "Estado",
      valor: usuario.activo ? "Activo" : "Inactivo",
    },
  ]

  return (
    <section className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Información de tu cuenta.
        </p>
      </header>

      <div className="max-w-md rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {usuario.nombre.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-medium">{usuario.nombre}</p>
            <p className="truncate text-sm text-muted-foreground">
              {usuario.email}
            </p>
          </div>
        </div>

        <dl className="flex flex-col gap-3">
          {campos.map(({ label, valor }) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="truncate text-sm font-medium">{valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default ProfilePage
