import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Remove sensitive fields that must never be sent to the backend
export function stripSensitiveFields<T extends Record<string, any>>(payload: T): T {
  const { net_to_deposit, ...rest } = payload
  return rest as T
}
