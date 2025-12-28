// API functions to fetch data from Cloudflare Worker

// Mock data for when the API is unavailable (like in preview environments)
const MOCK_STATS = {
  unclaimedLamports: "250000000", // 0.25 SOL
  lastClaimLamports: "1250000000", // 1.25 SOL
  lastClaimTs: Date.now() - 1000 * 60 * 15, // 15 minutes ago
}

const MOCK_DISBURSEMENTS = [
  {
    ts: Date.now() - 1000 * 60 * 14, // 14 minutes ago
    unclaimed: "875000000", // 0.875 SOL
    recipient: "Early Holders (70%)",
    txHash: "J8dKp2x...7b2c",
  },
  {
    ts: Date.now() - 1000 * 60 * 14, // 14 minutes ago
    unclaimed: "375000000", // 0.375 SOL
    recipient: "Dev Wallet (30%)",
    txHash: "Lm9Rp3z...5d1e",
  },
]

// Check if we're in a preview environment
const isPreviewEnvironment = () => {
  if (typeof window === "undefined") return true
  return window.location.hostname.includes("vusercontent.com") || window.location.hostname.includes("localhost")
}

// Get the worker URL from environment variables
export function getWorkerUrl() {
  // Use environment variable if available
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WORKER_URL) {
    return process.env.NEXT_PUBLIC_WORKER_URL
  }

  // Fallback for development/preview
  return "https://pumprevshareauto.workers.dev"
}

// Export the worker URL for use in components
export const WORKER_URL = getWorkerUrl()

// Helper function to safely parse JSON responses
export async function safeJsonFetch(url: string) {
  try {
    console.log(`Fetching from: ${url}`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const text = await response.text()
    console.log(`Response text: ${text.substring(0, 200)}${text.length > 200 ? "..." : ""}`)

    try {
      return JSON.parse(text)
    } catch (e) {
      console.error("Failed to parse JSON:", e)
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`)
    }
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error)
    throw error
  }
}

// Helper functions for data conversion
export function lamportsToSol(lamports: number | string | undefined | null) {
  if (lamports === undefined || lamports === null) return 0

  // Handle string values that might be in scientific notation
  let value: number
  if (typeof lamports === "string") {
    // Try to parse as a regular number first
    value = Number(lamports)

    // If it's NaN or 0 when it shouldn't be, try to handle it differently
    if (isNaN(value) || (value === 0 && lamports !== "0")) {
      console.warn(`Unusual lamports value: ${lamports}, trying alternative parsing`)
      // Try to handle scientific notation or other formats
      try {
        value = Number.parseFloat(lamports)
      } catch (e) {
        console.error(`Failed to parse lamports value: ${lamports}`, e)
        return 0
      }
    }
  } else {
    value = lamports
  }

  // Ensure we have a valid number
  if (isNaN(value)) {
    console.error(`Invalid lamports value: ${lamports}`)
    return 0
  }

  // Convert to SOL (1 SOL = 1,000,000,000 lamports)
  return value / 1_000_000_000
}

// Format timestamp to date
export function formatTimestamp(timestamp: number | string | undefined | null) {
  if (timestamp === undefined || timestamp === null) {
    console.warn("Undefined or null timestamp")
    return new Date()
  }

  console.log("Raw timestamp value:", timestamp, "Type:", typeof timestamp)

  let timeValue: number

  if (typeof timestamp === "string") {
    // Try to parse as a number
    timeValue = Number(timestamp)

    // If parsing failed or resulted in an invalid date, use current time
    if (isNaN(timeValue) || timeValue <= 0) {
      console.warn(`Invalid timestamp string: ${timestamp}, using current time`)
      return new Date()
    }
  } else {
    timeValue = timestamp
  }

  // Check if the timestamp is in seconds (Unix timestamp) or milliseconds
  // If it's in seconds, convert to milliseconds
  if (timeValue < 10000000000) {
    // Arbitrary threshold to distinguish seconds vs milliseconds
    timeValue *= 1000
  }

  // Sanity check - if the date is too far in the past or future, use current time
  const date = new Date(timeValue)
  const now = new Date()
  const yearsDiff = Math.abs(now.getFullYear() - date.getFullYear())

  if (yearsDiff > 5 || isNaN(date.getTime())) {
    console.warn(`Timestamp resulted in unreasonable date: ${date}, using current time`)
    return new Date()
  }

  return date
}

// Debug function to log data
export function debugLogData(data: any, label: string) {
  console.log(`--- DEBUG ${label} ---`)
  console.log(JSON.stringify(data, null, 2))
  console.log(`--- END ${label} ---`)
}
