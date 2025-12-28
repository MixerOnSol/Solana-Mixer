import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { TransactionFeed } from "@/components/transaction-feed"

export default function TransactionsPage() {
  return (
    <DashboardShell>
      <DashboardHeader title="Transactions" description="Complete history of claims and distributions" />
      <TransactionFeed />
    </DashboardShell>
  )
}
