import { DisbursementTracker } from "@/components/disbursement-tracker"
import { PumpHeader } from "@/components/pump-header"
import StatsBar from '../components/StatsBar';
import LogsTable from '../components/LogsTable';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-green-50/50 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-4">

        </div>
        <PumpHeader />
        <DisbursementTracker />
        <StatsBar />
        {/* <section>
          <h2 className="font-semibold mb-2">Recent Activity</h2>
          <LogsTable />
        </section> */}
      </div>
    </div>
  )
}
