export function getWindTip(windSpeedMs: number): string {
  if (windSpeedMs < 1.5) {
    return '바람이 거의 없어요 — 수면 반영샷·장노출 촬영에 좋은 조건입니다.';
  }
  if (windSpeedMs < 3.5) {
    return '선선한 바람이에요 — 벚꽃·단풍 촬영 시 꽃잎·잎 흔들림에 유의하세요.';
  }
  if (windSpeedMs < 6) {
    return '바람이 다소 강해요 — 삼각대 하단에 무게추를 걸어 흔들림을 줄이세요.';
  }
  return '바람이 강해요 — 장노출·드론 촬영은 피하고 삼각대를 낮게 세우세요.';
}
