import { createBrowserRouter } from "react-router"

import DashboardPage from "@/features/dashboard/pages/DashboardPage"
import NotFoundPage from "@/components/common/NotFoundPage"
import AppLayout from "@/components/layout/AppLayout"
import { LoginRoute, RequireAuth } from "@/features/auth/components/AuthGuards"
import InventoryPage from "@/features/inventory/pages/InventoryPage"
import KanbanPage from "@/features/kanban/pages/KanbanPage"
import LicensesPage from "@/features/licenses/pages/LicensesPage"
import PasswordsPage from "@/features/passwords/pages/PasswordsPage"
import AssignmentsPage from "@/features/assignments/pages/AssignmentsPage"
import ProjectsPage from "@/features/projects/pages/ProjectsPage"
import ReportsPage from "@/features/reports/pages/ReportsPage"
import TicketsPage from "@/features/tickets/pages/TicketsPage"
import ChangePasswordPage from "@/features/user/pages/ChangePasswordPage"
import AuditPage from "@/features/audit/pages/AuditPage"
import ReminderPage from "@/features/reminder/pages/ReminderPage"
import UsersPage from "@/features/user/pages/UsersPage"
import ProfilePage from "@/features/user/pages/ProfilePage"
import SettingsPage from "@/features/user/pages/SettingsPage"
import HomeRedirect from "@/router/HomeRedirect"
import MaintenancePage from "@/features/maintenance/pages/MaintenancePage"

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
          { path: "home", element: <DashboardPage /> },
          { path: "tickets", element: <TicketsPage /> },
          { path: "kanban", element: <KanbanPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "licenses", element: <LicensesPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "passwords", element: <PasswordsPage /> },
          { path: "assignments", element: <AssignmentsPage /> },
          { path: "maintenance", element: <MaintenancePage /> },
          { path: "audit", element: <AuditPage /> },
          { path: "reminder", element: <ReminderPage /> },
          { path: "user", element: <UsersPage /> },
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
