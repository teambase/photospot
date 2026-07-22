import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Spot, SpotStatus } from '../types';

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
