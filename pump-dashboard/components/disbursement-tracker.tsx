"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, Coins, MoonIcon, SunIcon } from "lucide-react"
import { formatSOL } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { formatTimestamp, lamportsToSol } from "@/lib/api"
import { fetcher } from "../lib/fetcher"
import useSWR from "swr"
import { useLiveUnclaimedSol } from "../hooks/useLiveUnclaimedSol"

interface Disbursement {
  id: string
  timestamp: Date
  amount: number
  recipient: string
  txHash: string
}

export function DisbursementTracker() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null)
  const metricsUrl = process.env.NEXT_PUBLIC_METRICS_URL!;
  const logsUrl = process.env.NEXT_PUBLIC_LOGS_URL!;

  // Fetch data using SWR with our custom fetcher
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR(metricsUrl, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    onSuccess: (data) => {
      console.log("Fetched stats data in DisbursementTracker:", data);
    },
  })

  const {
    data: disbursementsData,
    error: disbursementsError,
    isLoading: disbursementsLoading,
  } = useSWR(logsUrl, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    onSuccess: (data) => {
      console.log("Fetched disbursements data in DisbursementTracker:", data);
    },
  })

  const loading = statsLoading || disbursementsLoading
  const error = statsError || disbursementsError

  // Process stats data
  const lastClaimAmount = stats ? lamportsToSol(stats.lastClaimLamports) : 0
  const lastClaimTimestamp = stats ? formatTimestamp(stats.lastClaimTimestamp) : null
  // const unclaimedAmount = stats ? lamportsToSol(stats.unclaimedLamports) : 0; // Old way, remove or comment out

  // Get live unclaimed SOL from the new hook
  const { liveUnclaimedSol, isLoadingLiveUnclaimed, errorLiveUnclaimed } = useLiveUnclaimedSol();

  // Process disbursements data
  const disbursements: Disbursement[] = [];
  if (disbursementsData && Array.isArray(disbursementsData)) {
    disbursementsData.forEach((logEntry: any) => {
      if (logEntry.type === 'disbursement' && Array.isArray(logEntry.recipients)) {
        logEntry.recipients.forEach((recipientEntry: any, rIndex: number) => {
          disbursements.push({
            id: `${logEntry.txSig}-${rIndex}`, // Create a unique ID for each recipient
            timestamp: formatTimestamp(logEntry.ts),
            amount: lamportsToSol(Number(BigInt(recipientEntry.lamportsSent))), // lamportsSent is a string BigInt, convert to Number
            recipient: recipientEntry.owner,
            txHash: logEntry.txSig,
          });
        });
      }
      // Optionally, you could handle 'claim' logs differently here if needed for another display
    });
  }
  // Sort disbursements by timestamp, most recent first, if not already sorted by the API
  disbursements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // After mounting, we can show the theme toggle
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate next claim time (10 minutes after last claim)
  useEffect(() => {
    if (lastClaimTimestamp && lastClaimTimestamp instanceof Date && !isNaN(lastClaimTimestamp.getTime())) {
      console.log("Last claim timestamp:", lastClaimTimestamp.toISOString())

      const nextTime = new Date(lastClaimTimestamp)
      nextTime.setMinutes(nextTime.getMinutes() + 10)
      console.log("Next claim time:", nextTime.toISOString())

      // Only update if the time has actually changed
      setNextClaimTime((prevTime) => {
        if (!prevTime || prevTime.getTime() !== nextTime.getTime()) {
          return nextTime
        }
        return prevTime
      })
    } else {
      console.warn("Invalid lastClaimTimestamp:", lastClaimTimestamp)
    }
  }, [lastClaimTimestamp])

  const formatTime = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn("Invalid date in formatTime:", date)
      return "recently"
    }

    try {
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()

      // Sanity check - if the difference is negative or too large, return "recently"
      if (diffMs < 0 || diffMs > 1000 * 60 * 60 * 24 * 365 * 5) {
        // More than 5 years
        console.warn("Unreasonable time difference:", diffMs)
        return "recently"
      }

      const diffMins = Math.floor(diffMs / (1000 * 60))

      if (diffMins < 1) return "just now"
      if (diffMins < 60) return `${diffMins}m ago`

      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`

      const diffDays = Math.floor(diffHours / 24)
      if (diffDays > 365) {
        return "a long time ago"
      }
      return `${diffDays}d ago`
    } catch (error) {
      console.error("Error formatting time:", error)
      return "recently"
    }
  }

  const formatTimeUntil = (date: Date | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "calculating..."
    }

    const now = new Date()
    const diffMs = date.getTime() - now.getTime()

    if (diffMs <= 0) return "any moment now! 🎉"

    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000)

    return `${diffMins}m ${diffSecs}s`
  }

  // Memoize the formatTimeUntil function to prevent unnecessary recalculations
  const timeUntilNextClaim = React.useMemo(() => {
    return formatTimeUntil(nextClaimTime)
  }, [nextClaimTime])

  // Determine color and animation for countdown based on timeUntilNextClaim string
  let countdownColor = "text-green-500 dark:text-green-400";
  let countdownPulse = false;
  let countdownEmoji = "⏰";

  if (timeUntilNextClaim.includes("any moment now")) {
    countdownColor = "text-emerald-400 dark:text-emerald-300 font-bold";
    countdownPulse = true;
    countdownEmoji = "🎉";
  } else if (timeUntilNextClaim.startsWith("0m") || timeUntilNextClaim.startsWith("1m") || timeUntilNextClaim.startsWith("2m")) {
    countdownColor = "text-yellow-500 dark:text-yellow-400";
    countdownPulse = true;
  } else if (timeUntilNextClaim.startsWith("3m") || timeUntilNextClaim.startsWith("4m") || timeUntilNextClaim.startsWith("5m")) {
    countdownColor = "text-orange-500 dark:text-orange-400";
  }

  return (
    <div className="space-y-12">
      {/* Theme toggle button */}
      {mounted && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-4 border-green-300 dark:border-green-700 shadow-[5px_5px_0_#55D292] dark:shadow-[5px_5px_0_#2D7A4F] hover:translate-y-1 hover:shadow-[3px_3px_0_#55D292] dark:hover:shadow-[3px_3px_0_#2D7A4F] transition-all"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <SunIcon className="h-6 w-6 text-yellow-400" />
            ) : (
              <MoonIcon className="h-6 w-6 text-green-600" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-4 border-yellow-300 dark:border-yellow-700 p-4 rounded-xl text-yellow-800 dark:text-yellow-300 text-center">
          Failed to load data. Please check your connection.
        </div>
      )}

      <div className="grid gap-12 md:grid-cols-2">
        <div className="transform rotate-2 cartoon-pulse-shadow">
          <Card className="overflow-hidden border-[12px] border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 shadow-[10px_15px_0_#55D292] dark:shadow-[10px_15px_0_#2D7A4F] hover:translate-y-2 hover:shadow-[10px_10px_0_#55D292] dark:hover:shadow-[10px_10px_0_#2D7A4F] transition-all">
            <div className="bg-gradient-to-r from-green-400 to-emerald-400 dark:from-green-600 dark:to-emerald-600 p-6">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="bg-white/20 p-2 rounded-full">💰</span> Last Claim
              </h2>
            </div>
            <CardContent className="p-8">
              {loading ? (
                <div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-800 p-4 rounded-full transform -rotate-12 shadow-[3px_3px_0_#55D292] dark:shadow-[3px_3px_0_#2D7A4F]">
                      <ArrowUpRight className="h-10 w-10 text-green-500 dark:text-green-400" />
                    </div>
                    <div>
                      <span className="text-4xl font-extrabold text-green-500 dark:text-green-400">
                        {formatSOL(lastClaimAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <span className="rounded-full bg-green-100 dark:bg-green-800 px-5 py-3 text-xl font-medium transform rotate-2 shadow-[3px_3px_0_#55D292] dark:shadow-[3px_3px_0_#2D7A4F]">
                      {lastClaimTimestamp && !isNaN(lastClaimTimestamp.getTime())
                        ? formatTime(lastClaimTimestamp)
                        : "Never"}{" "}
                      ⏱️
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="transform -rotate-2 cartoon-pulse-shadow">
          <Card className="overflow-hidden border-[12px] border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 shadow-[10px_15px_0_#55D292] dark:shadow-[10px_15px_0_#2D7A4F] hover:translate-y-2 hover:shadow-[10px_10px_0_#55D292] dark:hover:shadow-[10px_10px_0_#2D7A4F] transition-all">
            <div className="bg-gradient-to-r from-emerald-400 to-teal-400 dark:from-emerald-600 dark:to-teal-600 p-6">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="bg-white/20 p-2 rounded-full">{countdownEmoji}</span> Next Claim
              </h2>
            </div>
            <CardContent className="p-8">
              {loading ? (
                <div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`bg-green-100 dark:bg-green-800 p-4 rounded-full transform rotate-12 shadow-[3px_3px_0_#55D292] dark:shadow-[3px_3px_0_#2D7A4F]`}>
                      <Coins className={`h-10 w-10 ${countdownColor.replace(/text-(.*?)-(\d+)/, 'text-$1-500 dark:text-$1-400')}`} />
                    </div>
                    <span className={`text-4xl font-extrabold ${countdownColor} ${countdownPulse ? 'animate-pulse' : ''} cartoon-bounce`}>
                      {timeUntilNextClaim}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <span className={`rounded-full bg-green-100 dark:bg-green-800 px-5 py-3 text-xl font-medium transform -rotate-2 shadow-[3px_3px_0_#55D292] dark:shadow-[3px_3px_0_#2D7A4F]`}>
                       Unclaimed: {isLoadingLiveUnclaimed ? '...' : formatSOL(liveUnclaimedSol ?? 0)} SOL <span className={countdownPulse ? 'animate-pulse': ''}>{isLoadingLiveUnclaimed ? '' : '🔄'}</span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Explanatory text */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border-[12px] border-green-300 dark:border-green-700 shadow-[10px_15px_0_#55D292] dark:shadow-[10px_15px_0_#2D7A4F] transform rotate-1 cartoon-wiggle">
        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4 doodle-underline">How It Works</h3>
        <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
          Pump.fun's Creator Revenue Share sends{" "}
          <span className="font-bold text-green-500 dark:text-green-400 text-2xl">0.05%</span> of every trade directly
          to the coin creator's wallet. This dashboard automatically claims those rewards and immediately redistributes
          them to early holders and the dev wallet. Below you can see all recent disbursements in real-time!
        </p>
      </div>

      <div className="transform -rotate-1 cartoon-pulse-shadow">
        <Card className="overflow-hidden border-[12px] border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 shadow-[10px_15px_0_#55D292] dark:shadow-[10px_15px_0_#2D7A4F]">
          <div className="bg-gradient-to-r from-teal-400 to-green-400 dark:from-teal-600 dark:to-green-600 p-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="bg-white/20 p-2 rounded-full">🎁</span> Recent Disbursements
            </h2>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                ))}
              </div>
            ) : disbursements.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">No disbursements yet</div>
            ) : (
              <div className="divide-y-4 divide-dashed divide-green-100 dark:divide-green-800">
                {disbursements.map((disbursement, index) => (
                  <div
                    key={disbursement.id}
                    className={`flex items-start justify-between p-8 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20 ${
                      index % 2 === 0 ? "transform rotate-1" : "transform -rotate-1"
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      <div className="rounded-full bg-green-100 dark:bg-green-800 p-4 text-green-500 dark:text-green-400 shadow-[3px_3px_0_#55D292] dark:shadow-[3px_3px_0_#2D7A4F] transform rotate-12">
                        <ArrowDownRight className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {disbursement.recipient}
                        </div>
                        <div className="text-xl text-green-500 dark:text-green-400 font-medium">
                          {disbursement.timestamp && !isNaN(disbursement.timestamp.getTime())
                            ? formatTime(disbursement.timestamp)
                            : "Unknown time"}{" "}
                          ⏱️
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-800 px-5 py-3 rounded-full transform -rotate-3 shadow-[3px_3px_0_#55D292] dark:shadow-[3px_3px_0_#2D7A4F]">
                      {formatSOL(disbursement.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
