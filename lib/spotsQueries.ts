import { useQuery } from '@tanstack/react-query';
import { fetchApprovedSpots, fetchSpotById } from './spotsRepo';

export const approvedSpotsQueryKey = ['approvedSpots'] as const;

export function useApprovedSpots() {
  return useQuery({
    queryKey: approvedSpotsQueryKey,
    queryFn: fetchApprovedSpots,
  });
}

export function useSpot(id: string | undefined) {
  return useQuery({
    queryKey: ['spot', id],
    queryFn: () => fetchSpotById(id as string),
    enabled: !!id,
  });
}
