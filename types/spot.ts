import type { ThemeId } from '../constants/colors';

export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  themes: ThemeId[];
  description: string;
  bestTimeNote: string;
  azimuthNote?: string;
  region: string;
  images: string[];
}

export interface WeatherSnapshot {
  spotId: string;
  date: string;
  sky: '맑음' | '구름많음' | '흐림';
  precipitationChance: number;
  cloudCoverPercent: number;
  dustGrade: '좋음' | '보통' | '나쁨' | '매우나쁨';
  sunriseTime: string;
  sunsetTime: string;
  moonPhase: number;
  windSpeedMs: number;
  windDirection: '북' | '북동' | '동' | '남동' | '남' | '남서' | '서' | '북서';
  updatedAt: string;
}

export interface CameraSetting {
  condition: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  note: string;
}
