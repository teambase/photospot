/**
 * React Native(Hermes)엔 URLSearchParams가 기본 제공되지 않아 직접 구현한다.
 * (브라우저/Node라면 URLSearchParams를 썼겠지만, RN에선 폴리필 없이 조용히 실패한다.)
 */
export function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}
