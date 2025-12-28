'use client';
import { useLogs } from '../hooks/useLogs';

export default function LogsTable() {
  const { data: logs, isLoading } = useLogs();

  if (isLoading) return <p>Loading logs…</p>;

  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th className="px-2 py-1 text-left">Time</th>
          <th className="px-2 py-1 text-left">Type</th>
          <th className="px-2 py-1 text-left">Tx</th>
          <th className="px-2 py-1 text-left">Recipients</th>
        </tr>
      </thead>
      <tbody>
        {logs.slice(0, 50).map((row: any) => (
          <tr key={row.txSig ?? row.sig ?? row.ts} className="border-t">
            <td className="px-2 py-1">{new Date(row.ts).toLocaleTimeString()}</td>
            <td className="px-2 py-1">{row.type}</td>
            <td className="px-2 py-1 truncate max-w-xs">{(row.txSig ?? row.sig ?? 'N/A').slice(0, 8)}…</td>
            <td className="px-2 py-1">{row.recipients?.length ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 