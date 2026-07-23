import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = Constants.expoConfig?.extra?.firebaseConfig ?? {};

const app = initializeApp(firebaseConfig);

// RN엔 WebChannel/WebSocket 지원이 없어 Firestore JS SDK 기본 연결 방식이 동작하지 않는다.
// 공식 워크어라운드로 롱폴링을 강제한다.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
