import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSOL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-- SOL"

  // Ensure we have a valid number
  if (isNaN(value)) {
    console.error(`Invalid SOL value: ${value}`)
    return "-- SOL"
  }

  // Format with 3 decimal places
  return `${value.toFixed(3)} SOL`
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "--"

  // Ensure we have a valid number
  if (isNaN(value)) {
    console.error(`Invalid number value: ${value}`)
    return "--"
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`
  }

  return value.toString()
}
