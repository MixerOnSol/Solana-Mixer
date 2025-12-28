"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, CheckCircle2, Clock, ExternalLink } from "lucide-react"
import { formatSOL } from "@/lib/utils"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

type TransactionType = "claim" | "distribute"

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  timestamp: Date
  status: "confirmed" | "pending"
  recipient?: string
  txHash: string
}

// Mock data
const mockTransactions: Transaction[] = [
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
  {
    id: "tx4",
    type: "claim",
    amount: 0.85,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: "confirmed",
    txHash: "Qw5Tp7x...3f2a",
  },
  {
    id: "tx5",
    type: "distribute",
    amount: 0.595,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60), // 2 hours - 1 minute ago
    status: "confirmed",
    recipient: "EARLY_HOLDER (70%)",
    txHash: "Rt6Yp9z...1c4b",
  },
  {
    id: "tx6",
    type: "distribute",
    amount: 0.255,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60), // 2 hours - 1 minute ago
    status: "confirmed",
    recipient: "DEV_RAKE (30%)",
    txHash: "Uv7Zq1a...8e3d",
  },
]

export function TransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "claims" | "distributions">("all")

  useEffect(() => {
    // Simulate API call
    const fetchTransactions = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setTransactions(mockTransactions)
      } catch (error) {
        console.error("Failed to fetch transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()

    // Set up polling every 30 seconds
    const interval = setInterval(fetchTransactions, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true
    if (activeTab === "claims") return tx.type === "claim"
    if (activeTab === "distributions") return tx.type === "distribute"
    return true
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Activity</CardTitle>
        <CardDescription>Recent claims and distributions</CardDescription>
        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No transactions found</p>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-full p-2 ${tx.type === "claim" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                  >
                    {tx.type === "claim" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {tx.type === "claim" ? "Claimed" : "Distributed"} {formatSOL(tx.amount)}
                      </p>
                      {tx.status === "confirmed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatTime(tx.timestamp)}</span>
                      {tx.recipient && (
                        <>
                          <span>•</span>
                          <span>To: {tx.recipient}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`https://solscan.io/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {tx.txHash.substring(0, 6)}...{tx.txHash.substring(tx.txHash.length - 4)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
