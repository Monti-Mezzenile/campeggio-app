// 🛑 OSTACOLI (percorsi degli asset originali)
export const HAZARDS = [
  { id: 'fuoco', icon: '/icons/fuoco.png', width: 55, height: 65, isSprite: false },
  { id: 'ceppo', icon: '/icons/ceppo.png', width: 65, height: 50, isSprite: false },
  { id: 'sasso', icon: '/icons/sasso.png', width: 58, height: 45, isSprite: false },
  { id: 'sasso_rotolante', icon: '/runner/sasso_rotolante.png', width: 60, height: 60, isSprite: true, speedMultiplier: 1.1 },
  { id: 'maialino', icon: '/runner/maglialino.png', width: 68, height: 52, isSprite: true, speedMultiplier: 1.15 },
];

// 🎁 BONUS E POWER-UP (percorsi degli asset originali)
export const COLLECTIBLES = [
  { id: 'carota', icon: '/icons/carota.png', width: 45, height: 45, points: 15, type: 'point' as const },
  { id: 'birra', icon: '/icons/birra.png', width: 42, height: 48, points: 25, type: 'point' as const },
  { id: 'lattina', icon: '/icons/lattina.png', width: 40, height: 42, points: 10, type: 'point' as const },
  { id: 'scudo', icon: '/runner/scudo.png', width: 48, height: 48, points: 20, type: 'shield' as const },
  { id: 'peperoncino', icon: '/runner/peperoncino.png', width: 48, height: 48, points: 30, type: 'sprint' as const },
  { id: 'calamita', icon: '/runner/calamita.png', width: 48, height: 48, points: 20, type: 'magnet' as const },
];

// 30s day, 10s dusk, 30s night, 10s dawn; tied to active game time.
export function getRunnerLighting(elapsedMs: number) {
  const seconds = (elapsedMs / 1000) % 80;
  const darkness = seconds < 30 ? 0 : seconds < 40 ? (seconds - 30) / 10 : seconds < 70 ? 1 : 1 - (seconds - 70) / 10;
  return { darkness, label: seconds < 30 ? 'Giorno' : seconds < 40 ? 'Tramonto' : seconds < 70 ? 'Notte' : 'Alba' };
}
export const getSpriteFrame = (elapsedMs: number) => Math.floor(elapsedMs / 100) % 4;

// A calm first 30 seconds, then a gradual increase over five minutes.
export function getRunnerPace(elapsedMs: number, sprint = false) {
  const progress = Math.min(1, Math.max(0, (elapsedMs - 30000) / 300000));
  return {
    speed: (3.6 + progress * 1.8) * (sprint ? 1.15 : 1),
    spawnDelay: 2100 - progress * 400,
  };
}
