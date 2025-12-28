import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  title: string
  description: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="https://pump.fun"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Pump.fun <ExternalLink className="h-3 w-3" />
        </Link>
        <span className="text-muted-foreground">|</span>
        <Link
          href="https://solscan.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Solscan <ExternalLink className="h-3 w-3" />
        </Link>
        <span className="text-muted-foreground">|</span>
        <Link
          href="https://birdeye.so"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Birdeye <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
