import { createBrowserRouter } from "react-router"

import NotFoundPage from "@/components/common/NotFoundPage"
import AppLayout from "@/components/layout/AppLayout"
import { LoginRoute, RequireAuth } from "@/features/auth/components/AuthGuards"
import InventoryPage from "@/features/inventory/pages/InventoryPage"
import KanbanPage from "@/features/kanban/pages/KanbanPage"
import LicensesPage from "@/features/licenses/pages/LicensesPage"
import PasswordsPage from "@/features/passwords/pages/PasswordsPage"
import ProjectsPage from "@/features/projects/pages/ProjectsPage"
import ReportsPage from "@/features/reports/pages/ReportsPage"
import TicketsPage from "@/features/tickets/pages/TicketsPage"
import ChangePasswordPage from "@/features/user/pages/ChangePasswordPage"
import ProfilePage from "@/features/user/pages/ProfilePage"
import SettingsPage from "@/features/user/pages/SettingsPage"
import HomeRedirect from "@/router/HomeRedirect"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginRoute />,
  },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: "tickets", element: <TicketsPage /> },
          { path: "kanban", element: <KanbanPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "licenses", element: <LicensesPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "passwords", element: <PasswordsPage /> },
          { path: "perfil", element: <ProfilePage /> },
          { path: "configuracion", element: <SettingsPage /> },
          { path: "cambiar-password", element: <ChangePasswordPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])

export { router }
