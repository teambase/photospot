export type ThemeId = 'sunset' | 'cherry' | 'autumn' | 'stars' | 'night' | 'fog';
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
  status: SpotStatus;
  source: SpotSource;
}
