import Constants from 'expo-constants';
import { buildQueryString } from './queryString';

const KASI_API_KEY = Constants.expoConfig?.extra?.kasiApiKey ?? '';
const BASE_URL = 'https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService';

/**
 * 한국천문연구원 출몰시각 정보 API 응답. 실제 응답으로 필드명 검증 완료(2026-07-23, location=서울).
 * XML만 지원하는 API라 fetch 후 정규식으로 값만 뽑아 쓴다
 * (RN에 DOMParser가 기본 없어 XML 파서 의존성을 새로 추가하기보다 간단한 태그 추출로 처리).
 *
 * 주의: `location` 파라미터는 위경도가 아니라 KASI가 정의한 지역명 문자열이어야 한다
 * (예: "서울", "부산"). Spot.region의 자유 텍스트를 그대로 넣으면 실패할 수 있어
 * 광역시·도 단위로 축약해 넘기는 전처리가 필요. moonset이 그날 없으면 "----"로 온다(달이
 * 지지 않는 날) — 소비하는 쪽에서 처리 필요.
 */
export interface RiseSetInfo {
  sunrise: string; // HHMM
  sunset: string; // HHMM
  moonrise: string; // HHMM
  moonset: string; // HHMM
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match?.[1]?.trim() ?? '';
}

export async function fetchRiseSetInfo(locationName: string, date: Date): Promise<RiseSetInfo> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const locdate = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

  const qs = buildQueryString({
    serviceKey: KASI_API_KEY,
    locdate,
    location: locationName,
    numOfRows: '10',
    pageNo: '1',
  });
  const res = await fetch(`${BASE_URL}/getAreaRiseSetInfo?${qs}`);
  const xml = await res.text();

  const resultCode = extractTag(xml, 'resultCode');
  if (resultCode && resultCode !== '00') {
    throw new Error(`KASI API 오류: ${resultCode} ${extractTag(xml, 'resultMsg')}`);
  }

  return {
    sunrise: extractTag(xml, 'sunrise'),
    sunset: extractTag(xml, 'sunset'),
    moonrise: extractTag(xml, 'moonrise'),
    moonset: extractTag(xml, 'moonset'),
  };
}
