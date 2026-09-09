export const MERGE_ITEMS = [
  { name: 'Carota', icon: '/merge/merge_carota.png', radius: 18, points: 10 },
  { name: 'Mela', icon: '/merge/merge_mela.png', radius: 24, points: 25 },
  { name: 'Patata', icon: '/merge/merge_patata.png', radius: 30, points: 50 },
  { name: 'Panino', icon: '/merge/merge_panino.png', radius: 36, points: 90 },
  { name: 'Lattina', icon: '/merge/merge_lattina.png', radius: 42, points: 150 },
  { name: 'Cosciotto', icon: '/merge/merge_cosciotto.png', radius: 48, points: 230 },
  { name: 'Boccale', icon: '/merge/merge_boccale.png', radius: 54, points: 330 },
  { name: 'Caciotta', icon: '/merge/merge_caciotta.png', radius: 60, points: 460 },
  { name: 'Barbecue', icon: '/merge/merge_barbecue.png', radius: 66, points: 620 },
  { name: 'Botte', icon: '/merge/merge_botte.png', radius: 72, points: 850 },
  { name: 'Tenda', icon: '/merge/merge_tenda.png', radius: 80, points: 1200 },
];
export const BOMB = -1, ROCK = -2, ICE = -3;
export const WIDTH = 360, HEIGHT = 460, RED_LINE = 85, STEP = 1000 / 60;
export const itemIcon = (type: number) => type === BOMB ? '/merge/merge_bomba.png' : type === ROCK ? '/merge/massi.png' : type === ICE ? '/merge/cubetto.png' : MERGE_ITEMS[type].icon;
export const itemName = (type: number) => type === BOMB ? 'Bomba' : type === ROCK ? 'Masso' : type === ICE ? 'Ghiaccio' : MERGE_ITEMS[type].name;
export const itemRadius = (type: number) => type < 0 ? 24 : MERGE_ITEMS[type].radius;
export interface Body { id: number; type: number; x: number; y: number; vx: number; vy: number; born: number; frozenUntil: number }
export interface MergeGame {
  phase: 'PLAYING' | 'GAMEOVER'; elapsed: number; score: number; merges: number; combo: number; comboUntil: number;
  current: number; next: number; aim: number; dropReadyAt: number; bodies: Body[]; nextId: number;
  fever: number; feverUntil: number; magnetUntil: number; magnetReadyAt: number; overflow: number;
  wave: number; nextRainAt: number; incoming: { x: number; type: number; at: number } | null;
  lastWind: number; notice: string; noticeUntil: number;
}
export function randomItem(score: number, random = Math.random) {
  const value = random();
  if (value < 0.05) return BOMB;
  if (score > 350 && value < 0.12) return ICE;
  if (score > 250 && value < (score > 2000 ? 0.25 : 0.18)) return ROCK;
  return Math.floor(random() * (score > 1500 ? 5 : score > 750 ? 4 : score > 250 ? 3 : 2));
}
export function createMergeGame(random = Math.random): MergeGame {
  return { phase: 'PLAYING', elapsed: 0, score: 0, merges: 0, combo: 0, comboUntil: 0,
    current: randomItem(0, random), next: randomItem(0, random), aim: 180, dropReadyAt: 0, bodies: [], nextId: 1,
    fever: 0, feverUntil: 0, magnetUntil: 0, magnetReadyAt: 0, overflow: 0,
    wave: -1, nextRainAt: 0, incoming: null, lastWind: -1, notice: '', noticeUntil: 0 };
}
export function rainSchedule(elapsed: number) {
  const wave = Math.floor((elapsed - 45000) / 40000);
  const start = 45000 + Math.max(0, wave) * 40000;
  const duration = Math.min(12000, 8000 + Math.max(0, wave) * 1000);
  return { wave, active: wave >= 0 && elapsed < start + duration, start, duration,
    interval: Math.max(850, 1500 - Math.max(0, wave) * 100),
    warning: elapsed >= 41000 && (wave < 0 || elapsed >= start + 36000),
    nextStart: wave < 0 ? 45000 : start + 40000 };
}
export function addBody(game: MergeGame, type: number, x: number) {
  const radius = itemRadius(type);
  game.bodies.push({ id: game.nextId++, type, x: Math.max(radius + 8, Math.min(WIDTH - radius - 8, x)),
    y: radius + 12, vx: 0, vy: 2, born: game.elapsed, frozenUntil: 0 });
}
export function dropItem(game: MergeGame, x: number, random = Math.random) {
  if (game.phase !== 'PLAYING' || game.elapsed < game.dropReadyAt) return false;
  addBody(game, game.current, x);
  game.current = game.next; game.next = randomItem(game.score, random);
  game.dropReadyAt = game.elapsed + 480;
  return true;
}
export function activateMagnet(game: MergeGame) {
  if (game.phase !== 'PLAYING' || game.elapsed < game.magnetReadyAt) return false;
  game.magnetUntil = game.elapsed + 1800; game.magnetReadyAt = game.elapsed + 18000;
  return true;
}
function notice(game: MergeGame, message: string) { game.notice = message; game.noticeUntil = game.elapsed + 1200; }

// Fixed 60Hz simulation. No wall-clock timers can leak into a later run.
export function stepMerge(game: MergeGame, random = Math.random) {
  if (game.phase !== 'PLAYING') return;
  game.elapsed += STEP;
  if (game.elapsed >= game.comboUntil) game.combo = 0;
  if (game.feverUntil && game.elapsed >= game.feverUntil) { game.feverUntil = 0; game.fever = 0; }
  const rain = rainSchedule(game.elapsed);
  if (rain.active) {
    if (game.wave !== rain.wave) { game.wave = rain.wave; game.nextRainAt = game.elapsed + 900; }
    if (!game.incoming && game.elapsed >= game.nextRainAt - 800) {
      const type = rain.wave >= 2 && random() < 0.15 ? ROCK : Math.floor(random() * 3);
      game.incoming = { type, x: 40 + random() * (WIDTH - 80), at: game.nextRainAt };
    }
    if (game.incoming && game.elapsed >= game.incoming.at) {
      addBody(game, game.incoming.type, game.incoming.x);
      game.incoming = null; game.nextRainAt = game.elapsed + rain.interval;
    }
  } else game.incoming = null;

  // Wind is deferred during rain to keep the two hazards readable.
  const wind = Math.floor((game.elapsed - 90000) / 55000);
  if (wind >= 0 && wind !== game.lastWind && !rain.active && !rain.warning) {
    game.lastWind = wind;
    const direction = random() > 0.5 ? 1 : -1;
    for (const body of game.bodies) { body.vx += direction * 4; body.vy -= 1; }
    notice(game, direction > 0 ? 'Raffica verso destra →' : '← Raffica verso sinistra');
  }

  const bodies = game.bodies;
  if (game.magnetUntil > game.elapsed) {
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      if (a.type < 0 || a.type !== b.type) continue;
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
      if (distance > 10) { a.vx += dx / distance * 0.5; a.vy += dy / distance * 0.5; b.vx -= dx / distance * 0.5; b.vy -= dy / distance * 0.5; }
    }
  }
  for (const body of bodies) {
    body.vy += 0.44; body.x += body.vx; body.y += body.vy; body.vx *= 0.95;
  }
  const removed = new Set<number>();
  const merged: Body[] = [];
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      if (removed.has(a.id) || removed.has(b.id)) continue;
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
      const overlap = itemRadius(a.type) + itemRadius(b.type) - distance;
      if (overlap <= 0) continue;
      if (a.type === BOMB || b.type === BOMB) {
        const bomb = a.type === BOMB ? a : b;
        for (const body of bodies) if (Math.hypot(body.x - bomb.x, body.y - bomb.y) < 110 + itemRadius(body.type)) removed.add(body.id);
        notice(game, 'BOOM! Spazio libero');
        continue;
      }
      if (a.type === ICE || b.type === ICE) {
        const ice = a.type === ICE ? a : b, victim = ice === a ? b : a;
        removed.add(ice.id); victim.frozenUntil = game.elapsed + 6000; notice(game, 'Congelato per 6s!');
        continue;
      }
      if (a.type >= 0 && a.type === b.type && a.type < MERGE_ITEMS.length - 1 && a.frozenUntil <= game.elapsed && b.frozenUntil <= game.elapsed) {
        removed.add(a.id); removed.add(b.id);
        merged.push({ id: game.nextId++, type: a.type + 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
          vx: (a.vx + b.vx) * 0.2, vy: -1, born: game.elapsed, frozenUntil: 0 });
        const points = MERGE_ITEMS[a.type + 1].points * (game.feverUntil > game.elapsed ? 2 : 1);
        game.score += points; game.merges++; game.combo++; game.comboUntil = game.elapsed + 1800;
        notice(game, `+${points}${game.combo > 1 ? ` · Combo ${game.combo}` : ''}`);
        if (!game.feverUntil) {
          game.fever = Math.min(100, game.fever + 10);
          if (game.fever === 100) game.feverUntil = game.elapsed + 8000;
        }
        continue;
      }
      // Separate even perfectly overlapping centres; impulse only while approaching.
      const nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
      a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
      b.x += nx * overlap / 2; b.y += ny * overlap / 2;
      const relative = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (relative > 0) { a.vx -= relative * nx * 0.6; a.vy -= relative * ny * 0.6; b.vx += relative * nx * 0.6; b.vy += relative * ny * 0.6; }
    }
    for (const body of bodies) {
      const radius = itemRadius(body.type);
      if (body.x < radius + 8) { body.x = radius + 8; body.vx = Math.abs(body.vx) * 0.22; }
      if (body.x > WIDTH - radius - 8) { body.x = WIDTH - radius - 8; body.vx = -Math.abs(body.vx) * 0.22; }
      if (body.y > HEIGHT - radius - 12) { body.y = HEIGHT - radius - 12; body.vy = 0; body.vx *= 0.8; }
    }
  }
  game.bodies = [...bodies.filter(body => !removed.has(body.id)), ...merged];
  // New falling pieces get time to enter the bowl; a blocked pile has 2s to recover.
  const overflowing = game.bodies.some(body => game.elapsed - body.born > 1800 && body.y - itemRadius(body.type) < RED_LINE);
  game.overflow = overflowing ? game.overflow + STEP : 0;
  if (game.overflow >= 2000) game.phase = 'GAMEOVER';
}
