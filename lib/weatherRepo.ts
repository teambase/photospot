import type { Spot, WeatherSnapshot } from '../types/spot';
import { toKmaGrid } from './kmaGrid';
import { fetchUltraSrtNcst, fetchVilageFcst } from './kmaWeather';
import { fetchRiseSetInfo } from './kasiAstro';
import { fetchCtprvnRltmMesureDnsty, khaiGradeToLabel } from './airKorea';
import { moonPhase } from './astro';

const WIND_DIRECTIONS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'] as const;

function degToCompass(deg: number): WeatherSnapshot['windDirection'] {
  const idx = Math.round(deg / 45) % 8;
  return WIND_DIRECTIONS[idx];
}

function skyCodeToSky(code: string | undefined): WeatherSnapshot['sky'] {
  if (code === '1') return '맑음';
  if (code === '3') return '구름많음';
  return '흐림'; // '4' 또는 값 없음
}

/** 기상청 SKY는 맑음/구름많음/흐림 3단계 코드만 주고 %는 안 준다 — 대표값으로 근사한다. */
function skyCodeToCloudPercent(code: string | undefined): number {
  if (code === '1') return 10;
  if (code === '3') return 50;
  return 90;
}

function formatHHMM(raw: string | undefined): string {
  const clean = (raw ?? '').trim();
  if (clean.length !== 4) return '--:--';
  return `${clean.slice(0, 2)}:${clean.slice(2)}`;
}

/** "서울 마포구" → "서울" — KASI location / AirKorea sidoName 둘 다 이 형태를 기대한다. */
function extractSido(region: string): string {
  return region.trim().split(/\s+/)[0] ?? region;
}

function nearestForecastValue(
  items: Awaited<ReturnType<typeof fetchVilageFcst>>,
  category: string
): string | undefined {
  const matches = items.filter((i) => i.category === category && i.fcstDate && i.fcstTime);
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => `${a.fcstDate}${a.fcstTime}`.localeCompare(`${b.fcstDate}${b.fcstTime}`));
  return matches[0].fcstValue;
}

// 같은 격자/시도를 쓰는 스팟이 많아, 세션 내에서 짧게 캐시해 중복 API 호출을 줄인다.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { value: unknown; expires: number }>();

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await fn();
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function fetchWeatherSnapshot(spot: Spot): Promise<WeatherSnapshot> {
  const { nx, ny } = toKmaGrid(spot.lat, spot.lng);
  const sido = extractSido(spot.region);
  const now = new Date();

  const [ncst, fcstItems, riseSet, airItems] = await Promise.all([
    cached(`ncst:${nx}:${ny}`, () => fetchUltraSrtNcst(spot.lat, spot.lng)),
    cached(`fcst:${nx}:${ny}`, () => fetchVilageFcst(spot.lat, spot.lng)),
    cached(`riseset:${sido}`, () => fetchRiseSetInfo(sido, now)),
    cached(`air:${sido}`, () => fetchCtprvnRltmMesureDnsty(sido)),
  ]);

  const skyCode = nearestForecastValue(fcstItems, 'SKY');
  const pop = nearestForecastValue(fcstItems, 'POP');
  const air = airItems[0]; // 시도 평균 대신 첫 측정소 값을 대표로 사용

  return {
    spotId: spot.id,
    date: now.toISOString().slice(0, 10),
    sky: skyCodeToSky(skyCode),
    precipitationChance: Number(pop ?? 0),
    cloudCoverPercent: skyCodeToCloudPercent(skyCode),
    dustGrade: air ? khaiGradeToLabel(air.khaiGrade) : '보통',
    sunriseTime: formatHHMM(riseSet.sunrise),
    sunsetTime: formatHHMM(riseSet.sunset),
    moonPhase: moonPhase(now),
    windSpeedMs: Number(ncst.WSD ?? 0),
    windDirection: degToCompass(Number(ncst.VEC ?? 0)),
    updatedAt: now.toISOString(),
  };
}
