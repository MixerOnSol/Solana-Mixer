import useSWR from 'swr';
import { fetcher } from '../lib/fetcher';

const logsUrl = process.env.NEXT_PUBLIC_LOGS_URL!;

export function useLogs() {
  const { data, error, isLoading } = useSWR(logsUrl, fetcher, {
    refreshInterval: 30000,
  });
  return { data: data ?? [], error, isLoading };
} 