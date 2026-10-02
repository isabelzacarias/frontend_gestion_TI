import { Circle, CircleCheck } from "lucide-react"

import { evaluatePasswordStrength } from "@/features/passwords/utils/password-strength"

interface PasswordStrengthIndicatorProps {
  password: string
}

function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = evaluatePasswordStrength(password)
  const barColor =
    strength.score === 5
      ? "bg-success"
      : strength.score >= 3
        ? "bg-warning"
        : "bg-destructive"
  const labelColor =
    strength.score === 5
      ? "text-success"
      : strength.score >= 3
        ? "text-warning"
        : strength.score > 0
          ? "text-destructive"
          : "text-muted-foreground"

  return (
    <div id="password-strength-help" className="space-y-3">
      <div
        className="flex items-center gap-1.5"
        role="img"
        aria-label={`Fortaleza de la contraseña: ${strength.label}`}
      >
        {strength.requirements.map((requirement, index) => (
          <span
            key={requirement.id}
            className={`h-1.5 flex-1 rounded-full ${
              index < strength.score ? barColor : "bg-muted"
            }`}
          />
        ))}
        <span className={`ml-2 min-w-16 text-right text-xs font-medium ${labelColor}`}>
          {strength.label}
        </span>
      </div>
      <ul
        className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-2"
        aria-label="Requisitos de la contraseña"
      >
        {strength.requirements.map(({ id, label, met }) => {
          const Icon = met ? CircleCheck : Circle
          return (
            <li key={id} className="flex items-center gap-2">
              <Icon
                aria-hidden="true"
                className={`size-3.5 shrink-0 ${
                  met ? "text-success" : "text-muted-foreground"
                }`}
              />
              <span className={met ? "text-foreground" : undefined}>
                {label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default PasswordStrengthIndicator
