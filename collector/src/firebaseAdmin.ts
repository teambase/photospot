import { readFileSync } from 'node:fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getDb() {
  if (getApps().length === 0) {
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!path) throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH가 .env에 설정되어 있지 않습니다.');
    const serviceAccount = JSON.parse(readFileSync(path, 'utf-8'));
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}
