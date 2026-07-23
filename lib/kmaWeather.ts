import Constants from 'expo-constants';
import { toKmaGrid } from './kmaGrid';
import { buildQueryString } from './queryString';

const KMA_API_KEY = Constants.expoConfig?.extra?.kmaApiKey ?? '';
const BASE_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

/**
 * 기상청 단기예보 API 응답 스키마. getUltraSrtNcst/getVilageFcst 둘 다 실제 응답으로
 * 필드명 검증 완료(2026-07-23, 서울 nx=60/ny=127 기준).
 */
interface KmaItem {
  baseDate: string;
  baseTime: string;
  category: string;
  nx: number;
  ny: number;
  obsrValue?: string; // getUltraSrtNcst(초단기실황)
  fcstDate?: string; // getVilageFcst(단기예보)
  fcstTime?: string;
  fcstValue?: string;
}

interface KmaResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: { items: { item: KmaItem[] } };
  };
}

async function callKma(path: string, params: Record<string, string>): Promise<KmaItem[]> {
  const qs = buildQueryString({ serviceKey: KMA_API_KEY, dataType: 'JSON', ...params });
  const url = `${BASE_URL}/${path}?${qs}`;
  const res = await fetch(url);
  const raw = await res.text();
  if (!raw.trim().startsWith('{')) {
    throw new Error(`KMA 응답이 JSON이 아님(HTTP ${res.status}): ${raw.slice(0, 100)}`);
  }
  const json: KmaResponse = JSON.parse(raw);
  if (json.response.header.resultCode !== '00') {
    throw new Error(`KMA API 오류: ${json.response.header.resultCode} ${json.response.header.resultMsg}`);
  }
  return json.response.body?.items.item ?? [];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateParts(d: Date) {
  return { date: `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`, d };
}

/** 초단기실황은 매시 40분에 생성 — 정시로부터 40분 안 지났으면 직전 시각 데이터를 쓴다. */
function ncstBaseDateTime() {
  const now = new Date();
  if (now.getMinutes() < 40) now.setHours(now.getHours() - 1);
  now.setMinutes(0, 0, 0);
  const { date } = dateParts(now);
  return { base_date: date, base_time: `${pad(now.getHours())}00` };
}

/** 단기예보는 02/05/08/11/14/17/20/23시에만 발표(10분 뒤부터 조회 가능) — 가장 최근 발표 시각을 찾는다. */
function vilageFcstBaseDateTime() {
  const SLOTS = [2, 5, 8, 11, 14, 17, 20, 23];
  const now = new Date();
  const usable = new Date(now.getTime() - 10 * 60 * 1000); // 발표 후 10분 버퍼
  let slot = [...SLOTS].reverse().find((h) => usable.getHours() >= h);
  if (slot === undefined) {
    usable.setDate(usable.getDate() - 1);
    slot = 23;
  }
  usable.setHours(slot, 0, 0, 0);
  const { date } = dateParts(usable);
  return { base_date: date, base_time: `${pad(slot)}00` };
}

/** 초단기실황(getUltraSrtNcst) — 현재 관측값. category: T1H(기온) RN1(강수량) REH(습도) PTY(강수형태) VEC(풍향) WSD(풍속) 등 */
export async function fetchUltraSrtNcst(lat: number, lng: number): Promise<Record<string, string>> {
  const { nx, ny } = toKmaGrid(lat, lng);
  const items = await callKma('getUltraSrtNcst', {
    ...ncstBaseDateTime(),
    nx: String(nx),
    ny: String(ny),
    numOfRows: '20',
    pageNo: '1',
  });
  return Object.fromEntries(items.map((i) => [i.category, i.obsrValue ?? '']));
}

/** 단기예보(getVilageFcst) — 오늘~모레 예보. category: POP(강수확률) SKY(하늘상태 1/3/4) TMP(기온) WSD(풍속) VEC(풍향) 등 */
export async function fetchVilageFcst(lat: number, lng: number): Promise<KmaItem[]> {
  const { nx, ny } = toKmaGrid(lat, lng);
  return callKma('getVilageFcst', {
    ...vilageFcstBaseDateTime(),
    nx: String(nx),
    ny: String(ny),
    numOfRows: '1000',
    pageNo: '1',
  });
}
