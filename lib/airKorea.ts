import Constants from 'expo-constants';
import type { WeatherSnapshot } from '../types/spot';
import { buildQueryString } from './queryString';

const AIRKOREA_API_KEY = Constants.expoConfig?.extra?.airkoreaApiKey ?? '';
const BASE_URL = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc';

/**
 * 에어코리아 시도별 실시간 측정정보 API 응답. 실제 응답으로 필드명 검증 완료(2026-07-23, sidoName=서울).
 */
interface AirKoreaItem {
  stationName: string;
  sidoName: string;
  dataTime: string;
  pm10Value: string;
  pm25Value: string;
  khaiValue: string; // 통합대기환경지수
  khaiGrade: string; // 1 좋음, 2 보통, 3 나쁨, 4 매우나쁨
}

interface AirKoreaResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: { items: AirKoreaItem[] };
  };
}

const GRADE_LABEL: Record<string, WeatherSnapshot['dustGrade']> = {
  '1': '좋음',
  '2': '보통',
  '3': '나쁨',
  '4': '매우나쁨',
};

export function khaiGradeToLabel(khaiGrade: string): WeatherSnapshot['dustGrade'] {
  return GRADE_LABEL[khaiGrade] ?? '보통';
}

/** sidoName 예: "서울", "부산", "경기" — Spot.region에서 광역시·도 단위만 뽑아 넘겨야 한다. */
export async function fetchCtprvnRltmMesureDnsty(sidoName: string): Promise<AirKoreaItem[]> {
  const qs = buildQueryString({
    serviceKey: AIRKOREA_API_KEY,
    returnType: 'json',
    numOfRows: '100',
    pageNo: '1',
    sidoName,
    ver: '1.0',
  });
  const url = `${BASE_URL}/getCtprvnRltmMesureDnsty?${qs}`;
  const res = await fetch(url);
  const raw = await res.text();
  if (!raw.trim().startsWith('{')) {
    throw new Error(`AirKorea 응답이 JSON이 아님(HTTP ${res.status}): ${raw.slice(0, 100)}`);
  }
  const json: AirKoreaResponse = JSON.parse(raw);
  if (json.response.header.resultCode !== '00') {
    throw new Error(`AirKorea API 오류: ${json.response.header.resultCode} ${json.response.header.resultMsg}`);
  }
  return json.response.body?.items ?? [];
}
