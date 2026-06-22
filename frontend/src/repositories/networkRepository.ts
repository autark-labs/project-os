import { useQuery } from '@tanstack/react-query';
import { NetworkAPIClient } from '@/api/NetworkAPIClient';

export const privateAccessReconciliationQueryKey = ['private-access-reconciliation'];

export function usePrivateAccessReconciliationQuery() {
  return useQuery({
    queryKey: privateAccessReconciliationQueryKey,
    queryFn: () => NetworkAPIClient.privateAccessReconciliation(),
    refetchInterval: 10_000,
    staleTime: 10_000,
  });
}
