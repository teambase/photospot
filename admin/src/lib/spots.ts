import { collection, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { Spot, SpotStatus } from '../types';
import { SEED_SPOTS } from '../data/seedSpots';

const SPOTS_COLLECTION = 'spots';

export function subscribeToSpots(onChange: (spots: Spot[]) => void): () => void {
  const q = query(collection(db, SPOTS_COLLECTION), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Spot));
  });
}

export async function setSpotStatus(spotId: string, status: SpotStatus): Promise<void> {
  await updateDoc(doc(db, SPOTS_COLLECTION, spotId), { status });
}

export async function setSpotsStatus(spotIds: string[], status: SpotStatus): Promise<void> {
  const batch = writeBatch(db);
  for (const id of spotIds) {
    batch.update(doc(db, SPOTS_COLLECTION, id), { status });
  }
  await batch.commit();
}

/** RN 앱의 data/mockSpots.ts 스냅샷을 Firestore로 최초 1회 이관한다. 문서 id = spot id로 덮어쓴다. */
export async function seedSpotsFromMock(): Promise<number> {
  const batch = writeBatch(db);
  for (const spot of SEED_SPOTS) {
    const { id, ...rest } = spot;
    batch.set(doc(db, SPOTS_COLLECTION, id), rest);
  }
  await batch.commit();
  return SEED_SPOTS.length;
}
