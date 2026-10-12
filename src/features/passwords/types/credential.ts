import type { LucideIcon } from "lucide-react"

export interface Credential {
  id: string
  service: string
  account: string
  username: string
  password: string
  website: string
  category: string
  updatedAt: string
  createdBy: string
  notes: string
  icon: LucideIcon
}

export type CredentialDraft = Pick<
  Credential,
  "service" | "account" | "username" | "password" | "website" | "category" | "notes"
>
