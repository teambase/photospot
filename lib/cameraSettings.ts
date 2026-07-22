import type { ThemeId } from '../constants/colors';
import type { CameraSetting, WeatherSnapshot } from '../types/spot';

/** PRD 3.4 규칙 테이블 기반 카메라 세팅 조언. */
const RULES: Record<string, CameraSetting> = {
  goldenHourPortrait: {
    condition: '골든아워 + 역광 인물',
    aperture: 'f/2.8~4',
    shutterSpeed: '1/250 이상',
    iso: '100~400',
    note: '노출보정 -0.7, RAW 권장',
  },
  sunsetLandscape: {
    condition: '일몰·노을 풍경',
    aperture: 'f/8~11',
    shutterSpeed: '상황별 (브라케팅 권장)',
    iso: '100',
    note: '삼각대 권장, HDR 고려',
  },
  milkyWay: {
    condition: '은하수·별',
    aperture: '최대개방',
    shutterSpeed: '15~20초 (500 rule: 500 ÷ 화각환산 초점거리)',
    iso: '3200~6400',
    note: '삼각대 필수, 신월 전후 추천',
  },
  foggyOvercast: {
    condition: '안개·흐린날 풍경',
    aperture: 'f/8',
    shutterSpeed: '상황별',
    iso: '100~200',
    note: '화이트밸런스 다소 쿨하게',
  },
  clearBloomFoliage: {
    condition: '벚꽃·단풍 (맑음)',
    aperture: 'f/4~5.6',
    shutterSpeed: '1/250 이상',
    iso: '100~200',
    note: '역광 활용 시 -0.3~-0.7 보정',
  },
  nightView: {
    condition: '도심 야경',
    aperture: 'f/8',
    shutterSpeed: '2~10초',
    iso: '100',
    note: '삼각대 필수, 타이머·릴리즈 케이블로 흔들림 방지',
  },
};

export function getCameraSettings(
  themeId: ThemeId,
  weather?: WeatherSnapshot
): CameraSetting[] {
  switch (themeId) {
    case 'sunset':
      return [RULES.sunsetLandscape, RULES.goldenHourPortrait];
    case 'cherry':
    case 'autumn':
      if (weather && weather.sky !== '맑음') {
        return [RULES.foggyOvercast];
      }
      return [RULES.clearBloomFoliage];
    case 'stars':
      return [RULES.milkyWay];
    case 'fog':
      return [RULES.foggyOvercast];
    case 'night':
      return [RULES.nightView];
    default:
      return [];
  }
}
