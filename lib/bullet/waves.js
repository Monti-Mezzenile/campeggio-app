import { ENEMIES } from './core/data.js';

// Distinct HP and behaviour for every supplied sheet (before survival scaling).
export const FOES = {
  minion: { ...ENEMIES.ZOMBIE, id: 'rat', name: 'Ratto', sprite: 'minion', hp: 24, speed: 86, damage: 9, exp: 10, size: 15 },
  minion2: { ...ENEMIES.SKELETON, id: 'beetle', name: 'Scarabeo', sprite: 'minion2', hp: 68, speed: 72, damage: 16, exp: 20, size: 19 },
  fast: { ...ENEMIES.BAT, id: 'wasp', name: 'Vespa', sprite: 'fast', hp: 18, speed: 132, damage: 8, exp: 8, size: 12 },
  fast2: { ...ENEMIES.BAT, id: 'dragonfly', name: 'Libellula', sprite: 'fast2', hp: 38, speed: 112, damage: 12, exp: 15, zigzag: true, size: 15 },
  fast3: { ...ENEMIES.WOLF, id: 'bat_pack', name: 'Pipistrello', sprite: 'fast3', hp: 46, speed: 94, damage: 19, exp: 18, dashSpeed: 290, dashDuration: 0.48, dashInterval: 4, size: 17 },
  heavy: { ...ENEMIES.GOLEM, id: 'armoured', name: 'Corazzato', sprite: 'heavy', hp: 210, shieldHp: 55, speed: 43, damage: 28, exp: 50, size: 27 },
  heavy2: { ...ENEMIES.MAGE, id: 'spider', name: 'Ragno acido', sprite: 'heavy2', hp: 320, speed: 48, damage: 24, exp: 65, keepDistance: 240, firingRange: 470, projectileSpeed: 160, projectileDamage: 13, fireCooldown: 3.4, size: 28 },
  stealth: { ...ENEMIES.MAGE, id: 'stalker', name: 'Predatore', sprite: 'stealth', hp: 92, speed: 83, damage: 18, exp: 30, keepDistance: 300, firingRange: 520, projectileSpeed: 195, projectileDamage: 10, fireCooldown: 3.1, size: 18 },
};
export const BOSS_ROSTER = [
  { id: 'iron_jaw', name: 'Fauci di ferro', sprite: 'boss', hp: 1100, speed: 82, damage: 36, exp: 220, size: 43, color: '#e8bc70', boss: true, pattern: 'barrage' },
  { id: 'siege_scorpion', name: 'Scorpione d’assedio', sprite: 'boss2', hp: 1650, speed: 70, damage: 42, exp: 320, size: 46, color: '#ef986b', boss: true, pattern: 'spiral' },
  { id: 'brood_queen', name: 'Regina della covata', sprite: 'boss3', hp: 2300, speed: 62, damage: 48, exp: 450, size: 50, color: '#b5dd78', boss: true, pattern: 'venom' },
];
export const WAVE_SECONDS = 40;
export const WAVE_PATTERNS = [
  { title: 'Sciame', formation: 'swarm', pool: ['minion', 'fast'], interval: 4.4, count: 4 },
  { title: 'Tenaglia', formation: 'pincer', pool: ['minion2', 'fast2'], interval: 6, count: 6 },
  { title: 'Colonna blindata', formation: 'column', pool: ['heavy', 'minion2', 'stealth'], interval: 6, count: 3 },
  { title: 'Accerchiamento', formation: 'ring', pool: ['minion', 'minion2', 'fast3'], interval: 8, count: 8 },
  { title: 'Fuoco incrociato', formation: 'crossfire', pool: ['heavy2', 'stealth', 'minion2'], interval: 6.5, count: 4 },
  { title: 'Picchiata', formation: 'dive', pool: ['fast2', 'fast3', 'fast'], interval: 5, count: 5 },
];
export function waveAt(time) {
  const number = Math.floor(time / WAVE_SECONDS) + 1;
  const age = time % WAVE_SECONDS;
  const boss = number % 4 === 0;
  const index = (number - 1 - Math.floor((number - 1) / 4)) % WAVE_PATTERNS.length;
  const plan = boss ? { title: 'Assedio', formation: 'pincer', pool: ['minion', 'fast3'], interval: 8, count: 2 } : WAVE_PATTERNS[index];
  return { ...plan, number, boss, age, breather: age >= 32, secondsLeft: Math.ceil(WAVE_SECONDS - age) };
}
export function formationSide(formation, member, packet) {
  if (formation === 'pincer' || formation === 'crossfire') return (packet % 2 ? ['north', 'south'] : ['west', 'east'])[member % 2];
  if (formation === 'ring') return ['north', 'east', 'south', 'west'][member % 4];
  return ['north', 'east', 'south', 'west'][packet % 4];
}

// First learn each boss, then fight every pair, then the complete trio.
export function bossGroupAt(encounter) {
  if (encounter < 3) return [BOSS_ROSTER[encounter]];
  if (encounter < 6) return [BOSS_ROSTER[(encounter - 3) % 3], BOSS_ROSTER[(encounter - 2) % 3]];
  return [0, 1, 2].map(i => BOSS_ROSTER[(i + encounter) % 3]);
}
