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

// Each 45-second phase ends with a five-second crossfade into the next.
export function getRunnerLighting(elapsedMs: number) {
  const seconds = (elapsedMs / 1000) % 90;
  const darkness = seconds < 40 ? 0 : seconds < 45 ? (seconds - 40) / 5 : seconds < 85 ? 1 : 1 - (seconds - 85) / 5;
  return { darkness, label: seconds < 40 ? 'Giorno' : seconds < 45 ? 'Tramonto' : seconds < 85 ? 'Notte' : 'Alba' };
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

export const laneFloor = (lane: number) => 12 + (2 - lane) * 40;
export const clampLane = (lane: number) => Math.max(0, Math.min(2, lane));
export function runnerContact(playerFloor: number, jump: number, entityFloor: number, collectible: boolean, height: number) {
  return Math.abs(playerFloor - entityFloor) < 16 && (collectible ? jump <= 2 : jump < height - 10);
}

// Alternating, announced waves. Full-width barriers arrive only after two minutes.
export function runnerWave(index: number, elapsed: number) {
  if (elapsed >= 120000 && index % 3 === 2) return {
    label: 'DOGANA DEL DISAGIO · SALTA!',
    hazards: [0, 1, 2].map(lane => ({ lane, offset: 0, hazard: 1, targetLane: lane })),
  };
  if (index % 2 === 0) return {
    label: 'SORPASSO SUINO · CAMBIANO CORSIA!',
    hazards: [{ lane: 0, offset: 0, hazard: 4, targetLane: 1 }, { lane: 2, offset: 190, hazard: 4, targetLane: 1 }],
  };
  return {
    label: 'FRANA CON PERSONALITÀ · OCCHIO AI SASSI!',
    hazards: [{ lane: 0, offset: 0, hazard: 3, targetLane: 0 }, { lane: 1, offset: 180, hazard: 3, targetLane: 1 }, { lane: 2, offset: 360, hazard: 3, targetLane: 2 }],
  };
}

// Four 256px frames per phase. The baby rabbit keeps its original still image.
export const getMascotRunSheet = (phase: number) => Number.isInteger(phase) && phase >= 2 && phase <= 9 ? `/runner/fase${phase}_run.png` : null;
export const getMascotRunFrame = (elapsed: number, airborne = false) => airborne ? 1 : Math.floor(elapsed / 180) % 4;
