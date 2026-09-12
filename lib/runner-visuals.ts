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
  return Math.abs(playerFloor - entityFloor) < (collectible ? 16 : 12) && (collectible ? jump <= 2 : jump < height * 0.55);
}

// Only the first circuit announces formations; later circuits remix them.
interface RunnerWave {
  label: string;
  hazards: { lane: number; offset: number; hazard: number; targetLane: number; switchFraction?: number }[];
  pickups?: { lane: number; offset: number; item: number }[];
}
export function runnerWave(index: number, elapsed: number, random = Math.random): RunnerWave {
  if (index >= 8) return advancedRunnerWave(index, random);
  const kind = index % 8;
  if (kind === 3) return {
    label: 'GIRO OFFERTO · SEGUI LE BIRRE!',
    hazards: [],
    pickups: Array.from({ length: 12 }, (_, i) => ({ lane: [1, 0, 1, 2][Math.floor(i / 3)], offset: i * 90, item: 1 })),
  };
  if (kind === 4) return {
    label: 'GRIGLIATA IN AUTOSTRADA · SEGUI IL VARCO!',
    hazards: [0, 1, 2].flatMap(row => [0, 1, 2].filter(lane => lane !== row).map(lane => ({ lane, offset: row * 280, hazard: 0, targetLane: lane }))),
    pickups: [0, 1, 2].map(lane => ({ lane, offset: lane * 280, item: 0 })),
  };
  if (kind === 6) return {
    label: 'RADUNO DEI SUINI · SI STRINGONO AL CENTRO!',
    hazards: [0, 1].flatMap(row => [0, 2].map(lane => ({ lane, offset: row * 300, hazard: 4, targetLane: 1 }))),
    pickups: [{ lane: 0, offset: 520, item: 3 }, { lane: 2, offset: 520, item: 1 }],
  };
  if (kind === 7) return {
    label: 'IL CONTO È ARRIVATO · SASSI IN FILA!',
    hazards: [0, 1, 2, 1].map((lane, i) => ({ lane, offset: i * 240, hazard: 3, targetLane: lane })),
    pickups: [{ lane: 2, offset: 160, item: 1 }, { lane: 0, offset: 640, item: 1 }],
  };
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

export function runnerWaveInterval(index: number) {
  return index < 8 ? 30000 : Math.max(8500, 15000 - (index - 8) * 450);
}

function advancedRunnerWave(index: number, random: () => number): RunnerWave {
  const pick = (count: number) => Math.floor(random() * count);
  // Gradually approach the physical limits instead of repeating a final tier.
  const pressure = 1 - 1 / (1 + (index - 8) / 12);
  const rows = 4 + Math.floor(pressure * 6) + pick(3);
  const hazards: RunnerWave['hazards'] = [];
  const pickups: NonNullable<RunnerWave['pickups']> = [];
  let offset = 0;
  let previousGate = false;
  const add = (lane: number, hazard: number, targetLane = lane) => {
    hazards.push({ lane, offset, hazard, targetLane,
      ...(hazard === 4 ? { switchFraction: 0.72 + random() * 0.24 } : {}) });
  };
  for (let row = 0; row < rows; row++) {
    // Choose each row independently: no fixed slalom, wave theme or pig route.
    const gap = pick(3);
    const gate = random() < 0.12 + pressure * 0.2;
    if (row) {
      const minimum = gate || previousGate ? 285 : Math.round(290 - pressure * 60);
      offset += minimum + pick(Math.round(100 - pressure * 55));
    }
    if (gate) {
      for (let lane = 0; lane < 3; lane++) add(lane, 1);
    } else {
      const count = random() < 0.45 + pressure * 0.5 ? 2 : 1;
      const occupied = [0, 1, 2].filter(lane => lane !== gap);
      if (random() < 0.5) occupied.reverse();
      const starts = [0, 1, 2];
      for (let i = 0; i < count; i++) {
        const hazard = pick(5);
        if (hazard === 4) {
          // Independent destinations allow straight runs, convergence, outward
          // turns and crossings. Keep one destination lane open in every row.
          const start = starts.splice(pick(starts.length), 1)[0];
          add(start, hazard, occupied[pick(2)]);
        } else add(occupied[i], hazard);
      }
    }
    previousGate = gate;
  }
  // Rewards are unpredictable too, and safely follow the mixed formation.
  pickups.push({ lane: pick(3), offset: offset + 220 + pick(100), item: random() < 0.15 ? 3 : pick(3) });
  return { label: '', hazards, pickups };
}

// Four 256px frames per phase. The baby rabbit keeps its original still image.
export const getMascotRunSheet = (phase: number) => Number.isInteger(phase) && phase >= 2 && phase <= 10 ? `/runner/fase${phase}_run.png` : null;
export const getMascotRunFrame = (elapsed: number, airborne = false) => airborne ? 1 : Math.floor(elapsed / 180) % 4;

// Obstacles collide only at their core; bonus pickup keeps its generous full width.
export function runnerHorizontalContact(x: number, width: number, collectible: boolean) {
  const inset = collectible ? 0 : width * 0.25;
  const playerLeft = collectible ? 40 : 54;
  const playerRight = collectible ? 95 : 88;
  return x + inset < playerRight && x + width - inset > playerLeft;
}
