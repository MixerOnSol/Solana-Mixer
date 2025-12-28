import useSWR from 'swr';
import { fetcher } from '../lib/fetcher';

const metricsUrl = process.env.NEXT_PUBLIC_METRICS_URL!;

export function useStats() {
  const { data, error, isLoading } = useSWR(metricsUrl, fetcher, {
    refreshInterval: 30000,
  });
  return { data, error, isLoading };
} 