import type { ThemeId } from './colors';
import { colors, themeAccent } from './colors';

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

/** 테마 없이 수집된 스팟(예: data.go.kr 자동 수집분)도 안전하게 표시하기 위한 대체 메타. */
const UNTAGGED_THEME_META: ThemeMeta = {
  id: 'fog',
  label: '미분류',
  icon: 'location-outline',
  color: colors.textTertiary,
};

/** 목록/마커 등에서 스팟의 대표 테마를 가져올 때 쓴다. themes가 비어 있어도 죽지 않는다. */
export function getPrimaryThemeMeta(themes: ThemeId[]): ThemeMeta {
  return themes[0] ? getThemeMeta(themes[0]) : UNTAGGED_THEME_META;
}
