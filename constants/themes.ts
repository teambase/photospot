import type { ThemeId } from './colors';
import { themeAccent } from './colors';

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
  color: string;
}

export const THEMES: ThemeMeta[] = [
  { id: 'sunset', label: '일몰·일출', icon: 'sunny', color: themeAccent.sunset },
  { id: 'cherry', label: '벚꽃', icon: 'flower', color: themeAccent.cherry },
  { id: 'autumn', label: '단풍', icon: 'leaf', color: themeAccent.autumn },
  { id: 'stars', label: '은하수·별', icon: 'sparkles', color: themeAccent.stars },
  { id: 'night', label: '야경', icon: 'business', color: themeAccent.night },
  { id: 'fog', label: '안개', icon: 'cloud', color: themeAccent.fog },
];

export function getThemeMeta(id: ThemeId): ThemeMeta {
  const found = THEMES.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown theme id: ${id}`);
  return found;
}
