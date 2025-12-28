import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function RecipientsPage() {
  // Mock data for recipients
  const recipients = [
    { id: 1, name: "Early Holder", address: "8xH4...", percentage: 70 },
    { id: 2, name: "Dev Rake", address: "9zT5...", percentage: 30 },
  ]

  return (
    <DashboardShell>
      <DashboardHeader title="Recipients" description="Manage payout recipients and percentages" />
      <div className="flex justify-end mb-4">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Recipient
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payout Recipients</CardTitle>
          <CardDescription>Configure who receives distributions and their percentage share</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell className="font-medium">{recipient.name}</TableCell>
                  <TableCell>{recipient.address}</TableCell>
                  <TableCell className="text-right">{recipient.percentage}%</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
