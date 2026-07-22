import type { WeatherSnapshot } from '../types/spot';

export interface ScoreResult {
  score: number;
  label: '매우 좋음' | '좋음' | '보통' | '아쉬움';
}

/**
 * v1 규칙 기반 추천 점수: 구름량 20~60%(노을에 유리), 강수 없음, 미세먼지 보통 이하 가중 합산.
 * PRD 3.2 기준.
 */
export function scoreWeather(weather: WeatherSnapshot): ScoreResult {
  let score = 0;

  if (weather.cloudCoverPercent >= 20 && weather.cloudCoverPercent <= 60) {
    score += 40;
  } else if (weather.cloudCoverPercent < 20) {
    score += 25;
  } else {
    score += Math.max(0, 40 - (weather.cloudCoverPercent - 60) * 0.8);
  }

  if (weather.precipitationChance === 0) {
    score += 30;
  } else {
    score += Math.max(0, 30 - weather.precipitationChance * 0.6);
  }

  if (weather.dustGrade === '좋음') score += 30;
  else if (weather.dustGrade === '보통') score += 20;
  else if (weather.dustGrade === '나쁨') score += 8;
  else score += 0;

  score = Math.round(Math.min(100, score));

  let label: ScoreResult['label'];
  if (score >= 80) label = '매우 좋음';
  else if (score >= 60) label = '좋음';
  else if (score >= 40) label = '보통';
  else label = '아쉬움';

  return { score, label };
}
