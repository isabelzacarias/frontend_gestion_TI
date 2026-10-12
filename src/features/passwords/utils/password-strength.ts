export interface PasswordRequirement {
  id: string
  label: string
  met: boolean
}

export interface PasswordStrength {
  requirements: PasswordRequirement[]
  score: number
  isStrong: boolean
  label: string
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    {
      id: "length",
      label: "Al menos 12 caracteres",
      met: password.length >= 12,
    },
    {
      id: "lowercase",
      label: "Una letra minúscula",
      met: /\p{Ll}/u.test(password),
    },
    {
      id: "uppercase",
      label: "Una letra mayúscula",
      met: /\p{Lu}/u.test(password),
    },
    {
      id: "number",
      label: "Un número",
      met: /\p{N}/u.test(password),
    },
    {
      id: "symbol",
      label: "Un símbolo",
      met: /[^\p{L}\p{N}]/u.test(password),
    },
  ]
  const score = requirements.filter((requirement) => requirement.met).length
  const isStrong = score === requirements.length

  return {
    requirements,
    score,
    isStrong,
    label:
      password.length === 0
        ? "Sin evaluar"
        : isStrong
          ? "Fuerte"
          : score >= 3
            ? "Media"
            : "Débil",
  }
}
