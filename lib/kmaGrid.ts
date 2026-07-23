/**
 * 위경도 → 기상청 단기예보 API 격자좌표(nx, ny) 변환.
 * 기상청이 공개한 LCC(Lambert Conformal Conic) 투영 계수를 그대로 사용한다.
 * 검증: 서울시청(37.5665,126.9780)→(60,127), 부산시청→(98,76), 제주시청→(53,38) — 기상청 공식 참조표와 일치.
 */

const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0; // 투영 위도1(deg)
const SLAT2 = 60.0; // 투영 위도2(deg)
const OLON = 126.0; // 기준점 경도(deg)
const OLAT = 38.0; // 기준점 위도(deg)
const XO = 43; // 기준점 X좌표(GRID)
const YO = 136; // 기준점 Y좌표(GRID)
const DEGRAD = Math.PI / 180.0;

export interface KmaGrid {
  nx: number;
  ny: number;
}

export function toKmaGrid(lat: number, lng: number): KmaGrid {
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + (lat * DEGRAD) * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}
