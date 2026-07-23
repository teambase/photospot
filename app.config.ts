import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const NAVER_MAP_CLIENT_ID = process.env.NAVER_MAP_CLIENT_ID ?? '';
const KMA_API_KEY = process.env.KMA_API_KEY ?? '';
const KASI_API_KEY = process.env.KASI_API_KEY ?? '';
const AIRKOREA_API_KEY = process.env.AIRKOREA_API_KEY ?? '';

const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY ?? '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.FIREBASE_APP_ID ?? '',
};

const config: ExpoConfig = {
  name: '포토스팟',
  slug: 'photospot',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'photospot',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.photospot.app',
    infoPlist: {
      UIBackgroundModes: ['location'],
    },
  },
  android: {
    package: 'com.photospot.app',
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          '등록한 촬영 스팟 근처에 도착하면 알림을 보내드리기 위해 위치 정보가 필요합니다.',
        isAndroidBackgroundLocationEnabled: true,
      },
    ],
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: NAVER_MAP_CLIENT_ID,
        ios: {
          NSLocationWhenInUseUsageDescription:
            '지도에서 내 주변 촬영 스팟을 보여드리기 위해 위치 정보가 필요합니다.',
        },
        android: {},
      },
    ],
  ],
  extra: {
    naverMapClientId: NAVER_MAP_CLIENT_ID,
    firebaseConfig: FIREBASE_CONFIG,
    kmaApiKey: KMA_API_KEY,
    kasiApiKey: KASI_API_KEY,
    airkoreaApiKey: AIRKOREA_API_KEY,
  },
};

export default config;
