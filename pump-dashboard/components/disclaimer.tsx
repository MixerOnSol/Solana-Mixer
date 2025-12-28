import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function Disclaimer() {
  return (
    <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Disclaimer</AlertTitle>
      <AlertDescription className="text-sm">
        This dashboard is experimental software and does not constitute financial advice. Solana transactions are
        irreversible; meme coins carry extreme risk.
      </AlertDescription>
    </Alert>
  )
}
