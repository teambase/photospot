import type { ThemeId } from './types';

const KEYWORD_THEMES: Array<{ pattern: RegExp; theme: ThemeId }> = [
  { pattern: /벚꽃/, theme: 'cherry' },
  { pattern: /단풍/, theme: 'autumn' },
  { pattern: /(은하수|천문대|별빛|밤하늘)/, theme: 'stars' },
  { pattern: /(운해|안개)/, theme: 'fog' },
  { pattern: /(일몰|낙조|해넘이|일출|해돋이|해변|해수욕장)/, theme: 'sunset' },
  { pattern: /(야경|전망대|타워)/, theme: 'night' },
];

/**
 * data.go.kr 관광지 데이터엔 사진 테마 태그가 없어 이름·소개문구에서 키워드로 후보 테마를 추정한다.
 * 정확하지 않을 수 있으므로 관리자가 승인 전에 검토/보정하는 것을 전제로 한다.
 */
export function guessThemes(name: string, intro: string): ThemeId[] {
  const text = `${name} ${intro}`;
  const matched = new Set<ThemeId>();
  for (const { pattern, theme } of KEYWORD_THEMES) {
    if (pattern.test(text)) matched.add(theme);
  }
  return [...matched];
}
