import 'dotenv/config';
import { createHash } from 'node:crypto';
import { fetchTourSpots, type TourSpotItem } from './dataGoKr';
import { guessThemes } from './guessThemes';
import { getDb } from './firebaseAdmin';
import type { Spot } from './types';

const SPOTS_COLLECTION = 'spots';

// 대한민국 대략적 위경도 범위 — 벗어나면 좌표 오류로 간주하고 건너뜀.
const KR_BOUNDS = { latMin: 33, latMax: 39, lngMin: 124, lngMax: 132 };

function toSpotCandidate(item: TourSpotItem): Spot | null {
  const lat = Number(item.latitude);
  const lng = Number(item.longitude);
  if (
    !item.trrsrtNm ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < KR_BOUNDS.latMin || lat > KR_BOUNDS.latMax ||
    lng < KR_BOUNDS.lngMin || lng > KR_BOUNDS.lngMax
  ) {
    return null;
  }

  const region = item.rdnmadr || item.lnmadr || item.insttNm || '';
  const id = 'dgk-' + createHash('sha1').update(`${item.trrsrtNm}|${item.lnmadr}`).digest('hex').slice(0, 12);

  return {
    id,
    name: item.trrsrtNm,
    lat,
    lng,
    themes: guessThemes(item.trrsrtNm, item.trrsrtIntrcn ?? ''),
    description: item.trrsrtIntrcn || '',
    bestTimeNote: '관리자 검토 필요 (자동 수집 — 촬영 시간대 미정)',
    region,
    images: [],
    status: 'pending',
    source: 'data-go-kr',
  };
}

async function main() {
  const apiKey = process.env.DATA_GO_KR_TRRSRT_API_KEY;
  if (!apiKey) throw new Error('DATA_GO_KR_TRRSRT_API_KEY가 .env에 설정되어 있지 않습니다.');
  const limit = Number(process.env.COLLECT_LIMIT ?? 50);

  console.log(`data.go.kr에서 최대 ${limit}건 조회 중...`);
  const rawItems = await fetchTourSpots(apiKey, limit);
  console.log(`조회됨: ${rawItems.length}건`);

  const candidates = rawItems.map(toSpotCandidate).filter((s): s is Spot => s !== null);
  console.log(`유효한 후보(좌표 검증 통과): ${candidates.length}건`);

  const db = getDb();
  const existingSnapshot = await db.collection(SPOTS_COLLECTION).where('source', '==', 'data-go-kr').get();
  const existingIds = new Set(existingSnapshot.docs.map((d) => d.id));

  const toWrite = candidates.filter((s) => !existingIds.has(s.id));
  console.log(`이미 수집된 항목 제외 후 신규: ${toWrite.length}건`);

  const CHUNK_SIZE = 400;
  for (let i = 0; i < toWrite.length; i += CHUNK_SIZE) {
    const chunk = toWrite.slice(i, i + CHUNK_SIZE);
    const batch = db.batch();
    for (const spot of chunk) {
      const { id, ...rest } = spot;
      batch.set(db.collection(SPOTS_COLLECTION).doc(id), rest);
    }
    await batch.commit();
    console.log(`  ${i + chunk.length}/${toWrite.length} 저장 완료`);
  }

  console.log(`완료. ${toWrite.length}건을 'pending' 상태로 새로 저장했습니다.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
