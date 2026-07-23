import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Spot } from '../types/spot';

const SPOTS_COLLECTION = 'spots';

/** 관리자 승인(status: 'approved')된 스팟만 조회한다. admin/에서 검토·승인한 결과가 이 쿼리에 반영된다. */
export async function fetchApprovedSpots(): Promise<Spot[]> {
  const q = query(collection(db, SPOTS_COLLECTION), where('status', '==', 'approved'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Spot);
}

export async function fetchSpotById(id: string): Promise<Spot | null> {
  const snapshot = await getDoc(doc(db, SPOTS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  const spot = { id: snapshot.id, ...snapshot.data() } as Spot;
  return spot.status === 'approved' ? spot : null;
}
