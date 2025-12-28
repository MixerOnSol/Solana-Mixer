import { NextResponse } from "next/server"

// In a real implementation, this would fetch from a database
// or directly from Solana blockchain
export async function GET() {
  try {
    // Mock data for demonstration
    const transactions = [
      {
        id: "tx1",
        type: "claim",
        amount: 1.25,
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        status: "confirmed",
        txHash: "Hc7Jmk2...9f3a",
      },
      {
        id: "tx2",
        type: "distribute",
        amount: 0.875,
        timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
        status: "confirmed",
        recipient: "EARLY_HOLDER (70%)",
        txHash: "J8dKp2x...7b2c",
      },
      {
        id: "tx3",
        type: "distribute",
        amount: 0.375,
        timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
        status: "confirmed",
        recipient: "DEV_RAKE (30%)",
        txHash: "Lm9Rp3z...5d1e",
      },
    ]

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
