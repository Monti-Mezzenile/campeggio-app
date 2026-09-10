export const MAX_MASCOT_PHASE = 10;
export const EXP_THRESHOLDS: Record<number, number> = { 1: 0, 2: 800, 3: 2500, 4: 6000, 5: 12000, 6: 22000, 7: 38000, 8: 60000, 9: 100000, 10: 150000 };
const names = ['Coniglio Piccolo', 'Roditore tabagista', 'Lepre disillusa dal Luppolo', 'Boscaiolo leporino spietato', 'Centauro-Lepre Maledetto', 'Cavallo da Soma senza Anima', 'Paladino Equino della Rovina', 'Destriero della Guerra perduta', 'Incubo Equino Infernale', 'Divinità Runica dell’Oblio'];
export const POSE_INTERVAL = 30 * 60 * 1000;
export const EVOLUTION_STAGES: Record<number, { name: string; image: string }> = Object.fromEntries(names.map((name, i) => [i + 1, { name, image: i === 0 ? '/tamagotchi/fase1_coniglio_piccolo.png' : `/posemascotte/fase${i + 1}_A.png` }]));
export function getStageFromExp(exp: number) {
  for (let phase = MAX_MASCOT_PHASE; phase > 1; phase--) if (exp >= EXP_THRESHOLDS[phase]) return phase;
  return 1;
}
export function getMascotPose(phase: number, now: number, mascotId = '') {
  if (!Number.isInteger(phase) || phase < 2 || phase > MAX_MASCOT_PHASE) return EVOLUTION_STAGES[1].image;
  // Stable across viewers and reloads, with a different starting pose per cavia.
  let offset = 0;
  for (const character of mascotId) offset = (Math.imul(offset, 31) + character.charCodeAt(0)) >>> 0;
  const pose = ['A', 'B', 'C', 'D'][(Math.floor(Math.max(0, now) / POSE_INTERVAL) + offset) % 4];
  return `/posemascotte/fase${phase}_${pose}.png`;
}
