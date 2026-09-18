import { Navigate, createBrowserRouter } from "react-router"

import NotFoundPage from "@/components/common/NotFoundPage"
import AppLayout from "@/components/layout/AppLayout"
import LoginPage from "@/features/auth/pages/LoginPage"
import InventoryPage from "@/features/inventory/pages/InventoryPage"
import KanbanPage from "@/features/kanban/pages/KanbanPage"
import LicensesPage from "@/features/licenses/pages/LicensesPage"
import ProjectsPage from "@/features/projects/pages/ProjectsPage"
import ReportsPage from "@/features/reports/pages/ReportsPage"
import TicketsPage from "@/features/tickets/pages/TicketsPage"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/tickets" replace /> },
      { path: "tickets", element: <TicketsPage /> },
      { path: "kanban", element: <KanbanPage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "licenses", element: <LicensesPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "reports", element: <ReportsPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])

export { router }
