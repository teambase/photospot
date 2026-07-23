/** 삭망월(29.53058867일) 기준 달의 위상(0=신월, 0.5=보름, 1=다음 신월)을 계산한다. API 불필요. */
export function moonPhase(date: Date): number {
  const SYNODIC_MONTH_DAYS = 29.53058867;
  const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const diffDays = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const phase = ((diffDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  return phase / SYNODIC_MONTH_DAYS;
}
