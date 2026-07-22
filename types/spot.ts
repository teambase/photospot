import type { ThemeId } from '../constants/colors';

export type SpotStatus = 'pending' | 'approved' | 'rejected';
export type SpotSource = 'manual' | 'data-go-kr';

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
  /** 관리자 승인 상태. 앱에는 'approved' 스팟만 노출된다 (getApprovedSpots 참고). */
  status: SpotStatus;
  /** 스팟 출처. 'manual'은 초기 수기 큐레이션, 'data-go-kr'은 공공데이터 자동 수집분. */
  source: SpotSource;
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
