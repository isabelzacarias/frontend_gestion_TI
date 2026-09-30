import { Navigate } from "react-router"

import { readAppPreferences } from "@/preferences/app-preferences"

function HomeRedirect() {
  return <Navigate to={readAppPreferences().homeRoute} replace />
}

export default HomeRedirect
