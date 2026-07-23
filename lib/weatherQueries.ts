import { useQueries, useQuery } from '@tanstack/react-query';
import type { Spot, WeatherSnapshot } from '../types/spot';
import { fetchWeatherSnapshot } from './weatherRepo';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useWeather(spot: Spot | null | undefined) {
  return useQuery({
    queryKey: ['weather', spot?.id],
    queryFn: () => fetchWeatherSnapshot(spot as Spot),
    enabled: !!spot,
    staleTime: STALE_TIME_MS,
  });
}

/** 여러 스팟의 날씨를 병렬로 가져와 spotId → WeatherSnapshot 맵으로 돌려준다 (추천 리스트용). */
export function useWeatherMap(spots: Spot[]): Map<string, WeatherSnapshot> {
  const results = useQueries({
    queries: spots.map((spot) => ({
      queryKey: ['weather', spot.id],
      queryFn: () => fetchWeatherSnapshot(spot),
      staleTime: STALE_TIME_MS,
    })),
  });

  const map = new Map<string, WeatherSnapshot>();
  spots.forEach((spot, i) => {
    const data = results[i]?.data;
    if (data) map.set(spot.id, data);
  });
  return map;
}
