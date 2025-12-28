'use client';
import { useStats } from '../hooks/useStats';

export default function StatsBar() {
  const { data, isLoading } = useStats();

  if (isLoading) return <p className="text-sm text-muted">Loading stats…</p>;
  if (!data || !data.runTimestamp) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <StatCard label="Last Run" value={new Date(data.runTimestamp).toLocaleTimeString()} />
      <StatCard label="Holders" value={data.holdersProcessed ?? 'N/A'} />
      <StatCard label="Batches" value={data.batchesSent ?? 'N/A'} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
} 