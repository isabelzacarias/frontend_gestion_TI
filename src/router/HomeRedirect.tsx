import { Navigate } from "react-router"

import { useAppPreferences } from "@/hooks/useAppPreferences"

function HomeRedirect() {
  const { preferences } = useAppPreferences()
  return <Navigate to={preferences.homeRoute} replace />
}

export default HomeRedirect
