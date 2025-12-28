"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, Coins, DollarSign, TrendingUp } from "lucide-react"
import { formatNumber, formatSOL } from "@/lib/utils"

export function StatsCards() {
  const [stats, setStats] = useState<{
    balance: number | null
    claimed24h: number | null
    price: number | null
    volume24h: number | null
  }>({
    balance: null,
    claimed24h: null,
    price: null,
    volume24h: null,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch from your API
    const fetchStats = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        setStats({
          balance: 5.234,
          claimed24h: 1.89,
          price: 0.00023,
          volume24h: 1250000,
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Set up polling every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dev Wallet Balance</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{formatSOL(stats.balance)}</div>
          )}
          <p className="text-xs text-muted-foreground">Auto-claims every 10 minutes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Claimed (24h)</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{formatSOL(stats.claimed24h)}</div>
          )}
          <p className="text-xs text-muted-foreground">+0.12 SOL from yesterday</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Token Price</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">${stats.price?.toFixed(6)}</div>
          )}
          <p className="text-xs text-muted-foreground">+5.2% in last 24h</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">${formatNumber(stats.volume24h)}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Estimated earnings: ~${formatNumber(stats.volume24h ? stats.volume24h * 0.0005 : 0)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
