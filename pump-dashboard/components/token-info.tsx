"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"

interface TokenData {
  name: string
  symbol: string
  marketCap: number
  holders: number
  totalSupply: number
}

export function TokenInfo() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchTokenData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200))

        // Mock data
        setTokenData({
          name: "PUMP Token",
          symbol: "PUMP",
          marketCap: 2500000,
          holders: 1250,
          totalSupply: 1000000000,
        })
      } catch (error) {
        console.error("Failed to fetch token data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenData()
  }, [])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Token Info</CardTitle>
        <CardDescription>Market data and statistics</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[220px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
        ) : tokenData ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{tokenData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Symbol</span>
              <span className="font-medium">{tokenData.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Cap</span>
              <span className="font-medium">${formatNumber(tokenData.marketCap)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Holders</span>
              <span className="font-medium">{formatNumber(tokenData.holders)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Supply</span>
              <span className="font-medium">{formatNumber(tokenData.totalSupply)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creator Fee</span>
              <span className="font-medium">0.05% per trade</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distribution</span>
              <span className="font-medium">Every 10 minutes</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6">Failed to load token data</p>
        )}
      </CardContent>
    </Card>
  )
}
