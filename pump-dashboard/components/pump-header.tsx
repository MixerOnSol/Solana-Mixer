"use client"

import { useEffect, useState } from "react"
import { formatSOL } from "@/lib/utils"
import { lamportsToSol } from "@/lib/api"
import { fetcher } from "../lib/fetcher"
import useSWR from "swr"
import Confetti from 'react-confetti';
import { usePrevious } from '../hooks/usePrevious';

export function PumpHeader() {
  const [animateValue, setAnimateValue] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const metricsUrl = process.env.NEXT_PUBLIC_METRICS_URL!;

  const { data: stats, error, isLoading } = useSWR(metricsUrl, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    onSuccess: (data) => {
      console.log("Fetched stats data in PumpHeader:", data);
    },
    onError: (err) => {
      console.error("Error fetching stats in PumpHeader:", err)
    },
  })

  const loading = isLoading
  const lastClaimAmount = stats?.lastClaimLamports ? lamportsToSol(stats.lastClaimLamports) : 0;
  const previousLastClaimAmount = usePrevious(lastClaimAmount);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (typeof lastClaimAmount === 'number' && 
        typeof previousLastClaimAmount === 'number' &&
        lastClaimAmount > 0 && 
        lastClaimAmount !== previousLastClaimAmount) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [lastClaimAmount, previousLastClaimAmount]);

  useEffect(() => {
    if (stats && typeof lastClaimAmount === 'number') {
      console.log("Last claim amount:", lastClaimAmount, "SOL")
      if (stats.lastClaimLamports) {
        console.log("Raw lastClaimLamports:", stats.lastClaimLamports)
      }

      setAnimateValue(0)
      let start = 0
      const increment = lastClaimAmount / 40
      const timer = setInterval(() => {
        start += increment
        if (start >= lastClaimAmount) {
          setAnimateValue(lastClaimAmount)
          clearInterval(timer)
        } else {
          setAnimateValue(start)
        }
      }, 50)

      return () => clearInterval(timer)
    }
  }, [stats, lastClaimAmount])

  return (
    <div className="mb-12 text-center">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300} />}
      <div className="inline-block cartoon-bounce mb-8">
        <div className="inline-flex items-center justify-center rounded-full bg-white dark:bg-gray-800 px-10 py-6 shadow-[0_15px_0_#55D292] dark:shadow-[0_15px_0_#2D7A4F] border-8 border-dashed border-green-300 dark:border-green-700 transform rotate-2">
          <h1 className="text-5xl font-extrabold text-green-500 dark:text-green-400 transform -rotate-2">PUMP</h1>
        </div>
      </div>

      {/* Social Links - Centered below the PUMP title */}
      <div className="flex justify-center space-x-4 mb-10">
        <a
          href="https://twitter.com/YOUR_TWITTER_HANDLE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-full border-4 border-dashed border-green-300 dark:border-green-700 shadow-[5px_5px_0_#55D292] dark:shadow-[5px_5px_0_#2D7A4F] hover:translate-y-1 hover:shadow-[3px_3px_0_#55D292] dark:hover:shadow-[3px_3px_0_#2D7A4F] transition-all cartoon-bounce"
          aria-label="Follow on X"
        >
          <svg fill="currentColor" viewBox="0 0 16 16" className="w-5 h-5 text-green-500 dark:text-green-400"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/></svg>
        </a>
        <a
          href="https://dexscreener.com/solana/YOUR_TOKEN_ADDRESS"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-full border-4 border-dashed border-green-300 dark:border-green-700 shadow-[5px_5px_0_#55D292] dark:shadow-[5px_5px_0_#2D7A4F] hover:translate-y-1 hover:shadow-[3px_3px_0_#55D292] dark:hover:shadow-[3px_3px_0_#2D7A4F] transition-all cartoon-bounce"
          aria-label="View on DexScreener"
        >
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-green-500 dark:text-green-400"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41L13.5 15.07l-4-4L2 17.08l1.5 1.41z"/></svg>
        </a>
      </div>

      {/* Main Fees Banner */}
      <div className="relative w-full max-w-3xl mx-auto p-8 overflow-hidden bg-white dark:bg-gray-800 rounded-[2rem] border-[12px] border-green-300 dark:border-green-700 shadow-[10px_15px_0_#55D292] dark:shadow-[10px_15px_0_#2D7A4F] transform rotate-1 cartoon-wiggle">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4 transform -rotate-2">
            WE JUST MADE
          </h2>

          {loading ? (
            <div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 mb-4"></div>
          ) : error ? (
            <div className="text-red-500 mb-4">Failed to load data</div>
          ) : (
            <>
              <div className="flex items-baseline mb-2 pow-effect justify-center">
                <span className="text-7xl font-extrabold text-green-500 dark:text-green-400 tracking-tighter cartoon-bounce">
                  ${(animateValue * 20).toFixed(2)}
                </span>
              </div>

              <div className="text-3xl font-bold text-green-500/80 dark:text-green-400/80 mb-6 text-center">
                {formatSOL(lastClaimAmount)}
              </div>
            </>
          )}

          <p className="text-2xl font-bold text-green-600 dark:text-green-400 text-center">
            IN FEES FROM <span className="text-green-500 dark:text-green-300 doodle-underline">$PUMP</span>!
          </p>
        </div>

        {/* Pill icon - hidden on small screens, shown on medium and up */}
        <div className="hidden md:block absolute right-8 top-1/2 transform -translate-y-1/2 rotate-12 cartoon-bounce">
          <div className="w-32 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex overflow-hidden border-4 border-green-300 dark:border-green-600 shadow-[5px_5px_0_#55D292] dark:shadow-[5px_5px_0_#2D7A4F]">
            <div className="w-1/2 h-full bg-green-400 dark:bg-green-500 flex items-center justify-center">
              <div className="w-3 h-8 bg-white rounded-full opacity-70 ml-2"></div>
            </div>
            <div className="w-1/2 h-full bg-white dark:bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
