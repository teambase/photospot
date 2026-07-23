export interface TourSpotItem {
  trrsrtNm: string;
  trrsrtSe: string;
  rdnmadr: string;
  lnmadr: string;
  latitude: string;
  longitude: string;
  trrsrtIntrcn: string;
  insttNm: string;
}

const ENDPOINT = 'https://api.data.go.kr/openapi/tn_pubr_public_trrsrt_api';

export async function fetchTourSpots(apiKey: string, limit: number): Promise<TourSpotItem[]> {
  const items: TourSpotItem[] = [];
  const pageSize = 100;
  let pageNo = 1;

  while (items.length < limit) {
    const url = `${ENDPOINT}?serviceKey=${apiKey}&pageNo=${pageNo}&numOfRows=${pageSize}&type=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`data.go.kr 요청 실패: ${res.status} ${res.statusText}`);
    const json = await res.json();

    const body = json?.response?.body;
    if (!body) throw new Error(`예상치 못한 응답 형식: ${JSON.stringify(json).slice(0, 500)}`);

    const pageItems: TourSpotItem[] = body.items ?? [];
    if (pageItems.length === 0) break;

    items.push(...pageItems);

    const totalCount = Number(body.totalCount ?? 0);
    if (pageNo * pageSize >= totalCount) break;
    pageNo += 1;
  }

  return items.slice(0, limit);
}
