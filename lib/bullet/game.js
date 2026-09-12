// Adapted from Desktop/gioco: entity, weapon and spatial collision implementations
// remain in core/. The DOM singleton, service worker and external shell are omitted.
import { CONFIG } from './core/config.js';
import { Player, Enemy, ExpOrb, Particle, FloatingText, findEnemyDef } from './core/entities.js';
import { PatternWeapon, SHOT_WEAPONS } from './shot-patterns.js';
import { Weapon } from './core/weapons.js';
import { WEAPONS, PASSIVES } from './core/data.js';
import { SpatialHash } from './core/spatial-hash.js';
import { WORLD, shootingPose } from './assets.js';
import { FOES, bossGroupAt, waveAt, formationSide } from './waves.js';
import { updateBoss, updateBossAttacks } from './bosses.js';
import { UPGRADE_CAP, upgradeDescription, tieredWeaponDefinition } from './upgrades.js';

const WEAPON_LABELS = {
  ...Object.fromEntries(SHOT_WEAPONS.map(w => [w.id, [w.name]])),
  knife: ['Raffica', 'Proiettili perforanti. Più colpi a ogni potenziamento.'],
  magic_wand: ['Colpo guidato', 'Insegue il nemico più vicino.'],
  orbit: ['Guardia rotante', 'Schegge orbitanti proteggono la cavia.'],
  mine: ['Trappola', 'Lascia una carica esplosiva lungo il percorso.'],
  frost_nova: ['Onda gelida', 'Danneggia e rallenta i nemici vicini.'],
};
const PASSIVE_LABELS = {
  might: ['Potenza', '+10% danni.'], cooldown: ['Grilletto facile', 'Attacchi più frequenti.'],
  movespeed: ['Passo svelto', 'Corri più velocemente.'], max_hp: ['Pellaccia', 'Aumenta la salute massima.'],
  magnet: ['Raccoglitore', 'Attira le carote da più lontano.'],
};
export const SPECIAL_COOLDOWN = 12;
export const SPECIAL_RADIUS = 240;
export const BOSS_RECOVERY_SECONDS = 8;
export function populationLimit(seconds, bossActive = false) {
  return bossActive ? Math.min(18, 10 + Math.floor(seconds / 180) * 2)
    : Math.min(48, 24 + Math.floor(seconds / 120) * 4);
}
export const scoreForRun = (kills, seconds) => kills * 10 + Math.floor(seconds) * 2;
export function difficultyAt(seconds) {
  return {
    hp: 0.9 + seconds / 420,
    damage: 0.7 + seconds / 900,
    speed: Math.min(1.3, 0.92 + seconds / 3600),
    spawnInterval: Math.max(0.28, 1.1 - seconds / 600),
    batch: Math.min(4, 1 + Math.floor(seconds / 600)),
  };
}
export const rewardForRun = (kills, seconds) => 2 * (Math.floor(kills / 4) + Math.floor(seconds / 6));
const noop = () => {};

export class BulletGame {
  constructor(covered, random = Math.random) {
    this.covered = covered;
    this.random = random;
    this.input = { getMoveVector: () => ({ x: 0, y: 0 }), clear: noop };
    this.audio = { shoot: noop, pickup: noop, explosion: noop, hit: noop };
    this.reset();
  }
  makeWeapon(def) {
    const weapon = new (def.type === 'pattern' ? PatternWeapon : Weapon)(tieredWeaponDefinition(def));
    const fire = weapon.fire.bind(weapon);
    weapon.fire = (player, game) => {
      const before = game.projectiles.length;
      fire(player, game);
      if (def.type !== 'projectile' || game.projectiles.length > before) this.attackAt = this.time;
    };
    return weapon;
  }
  reset() {
    this.recoveryUntil = 0; this.waveDelay = 0;
    this.state = 'ready'; this.time = 0; this.kills = 0; this.bossKills = 0;
    this.player = new Player(WORLD.width / 2, WORLD.height / 2);
    this.player.weapons = [this.makeWeapon(WEAPONS.KNIFE)];
    this.player.expToNext = 100;
    this.player.expGrowth = 1.35;
    this.player.expThresholdCap = 1500;
    this.enemies = []; this.projectiles = []; this.enemyProjectiles = []; this.expOrbs = [];
    this.mines = []; this.particles = []; this.floatingTexts = []; this.pickups = [];
    this.spatial = new SpatialHash(); this.run = {};
    this.attackAt = -100; this.specialAt = -100; this.specialReadyAt = 0; this.specialOrigin = null;
    this.shieldUntil = 0; this.speedUntil = 0; this.spawnTimer = 0;
    this.wave = waveAt(0); this.waveNumber = 0; this.packet = 0; this.nextBossIndex = 0;
    this.waveBossSpawned = false; this.bossShots = []; this.hazards = [];
    this.pendingLevels = 0; this.choices = []; this.shootingPose = 13;
    this.input.clear();
  }
  start() { this.reset(); this.state = 'playing'; this.updateWaves(0); }
  pause(force = false) {
    this.input.clear();
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused' && !force) this.state = 'playing';
  }
  finish() {
    if (['ready', 'over'].includes(this.state)) return;
    this.state = 'over'; this.input.clear();
  }
  get recovering() { return this.time < this.recoveryUntil; }
  get enemyLimit() {
    const bosses = this.enemies.filter(e => e.boss && e.hp > 0).length;
    return populationLimit(this.time, bosses > 0) + bosses;
  }
  trimPopulation(bossActive = this.enemies.some(e => e.boss && e.hp > 0)) {
    const bosses = this.enemies.filter(e => e.boss && e.hp > 0);
    const others = this.enemies.filter(e => !e.boss && e.hp > 0);
    others.sort((a, b) => Math.hypot(a.x - this.player.x, a.y - this.player.y) - Math.hypot(b.x - this.player.x, b.y - this.player.y));
    this.enemies = [...bosses, ...others.slice(0, populationLimit(this.time, bossActive))];
  }
  special() {
    if (this.state !== 'playing' || this.recovering || this.time < this.specialReadyAt) return false;
    this.specialAt = this.time; this.specialReadyAt = this.time + SPECIAL_COOLDOWN;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < SPECIAL_RADIUS + e.size) { e.takeDamage(80 * this.player.getDamageMult()); e.slowTimer = 2; e.slowPct = 0.65; }
    }
    this.enemyProjectiles = this.enemyProjectiles.filter(p => Math.hypot(p.x - this.player.x, p.y - this.player.y) > SPECIAL_RADIUS);
    this.specialOrigin = { x: this.player.x, y: this.player.y };
    this.createParticles(this.player.x, this.player.y, '#ddca83', 48);
    return true;
  }
  spawn(def, { side, anchor } = {}) {
    if (this.recovering || this.enemies.length >= CONFIG.MAX_ENEMIES || (!def?.boss && this.enemies.length >= this.enemyLimit)) return null;
    let candidates = this.covered.filter(p => Math.hypot(p.x - this.player.x, p.y - this.player.y) > 300);
    if (side) {
      const edge = candidates.filter(p => side === 'north' ? p.y < WORLD.height * 0.25 : side === 'south' ? p.y > WORLD.height * 0.75 : side === 'west' ? p.x < WORLD.width * 0.25 : p.x > WORLD.width * 0.75);
      if (edge.length) candidates = edge;
    }
    if (!candidates.length) return null;
    if (anchor) {
      let nearest = Infinity;
      for (const p of candidates) nearest = Math.min(nearest, Math.hypot(p.x - anchor.x, p.y - anchor.y));
      candidates = candidates.filter(p => Math.hypot(p.x - anchor.x, p.y - anchor.y) < nearest + 60);
    }
    const p = candidates[Math.floor(this.random() * candidates.length)];
    if (!def) def = FOES[this.wave.pool[Math.floor(this.random() * this.wave.pool.length)]];
    const difficulty = difficultyAt(this.time);
    const enemy = new Enemy(p.x, p.y, def, def.boss ? 1 : difficulty.hp, def.boss ? 1 : difficulty.damage);
    enemy.speed *= def.boss ? 1 : difficulty.speed;
    enemy.spawnedAt = this.time; enemy.motionSeed = this.random() * Math.PI * 2;
    this.enemies.push(enemy);
    return enemy;
  }
  updateWaves(dt) {
    this.wave = waveAt(this.time - this.waveDelay);
    if (this.recovering) return;
    if (this.wave.number !== this.waveNumber) {
      this.waveNumber = this.wave.number; this.packet = 0; this.spawnTimer = 0; this.waveBossSpawned = false;
    }
    if (this.wave.boss && !this.waveBossSpawned && !this.enemies.some(e => e.boss && e.hp > 0)) {
      const group = bossGroupAt(this.nextBossIndex);
      this.trimPopulation(true);
      if (this.enemies.length + group.length <= CONFIG.MAX_ENEMIES) {
        const spawned = group.map((def, i) => {
          const side = ['north', 'east', 'west'][(i + this.nextBossIndex) % 3];
          const enemy = this.spawn(def, { side });
          if (enemy) enemy.attackTimer = 1.4 + i * 0.6;
          return enemy;
        });
        if (spawned.some(Boolean)) { this.waveBossSpawned = true; this.nextBossIndex++; }
      }
    }
    const bossActive = this.enemies.some(e => e.boss && e.hp > 0);
    this.trimPopulation(bossActive);
    if (this.wave.breather && !bossActive) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const difficulty = difficultyAt(this.time);
    this.spawnTimer = Math.max(1.4, (bossActive ? 8 : this.wave.interval) * difficulty.spawnInterval / 1.1);
    const count = this.time === 0 ? 5 : bossActive ? 2 : Math.min(8, this.wave.count * difficulty.batch);
    const offset = (this.random() - 0.5) * 300;
    for (let i = 0; i < count; i++) {
      const side = formationSide(this.wave.formation, i, this.packet);
      const along = offset + (i - count / 2) * (this.wave.formation === 'column' ? 24 : 70);
      const anchor = side === 'north' || side === 'south'
        ? { x: this.player.x + along, y: side === 'north' ? 24 : WORLD.height - 24 }
        : { x: side === 'west' ? 24 : WORLD.width - 24, y: this.player.y + along };
      const pool = bossActive ? ['minion', 'fast3'] : this.wave.pool;
      const key = pool[(i + this.packet) % pool.length];
      this.spawn(FOES[key], { side, anchor });
    }
    this.packet++;
  }
  shake() { /* Deliberately keep the mobile camera stable. */ }
  createParticles(x, y, color, count) {
    for (let i = 0; i < count && this.particles.length < 180; i++) this.particles.push(new Particle(x, y, color));
  }
  createFloatingText(text, x, y, color) {
    if (this.floatingTexts.length < 35) this.floatingTexts.push(new FloatingText(text, x, y, color));
  }
  collectDeaths() {
    const dead = this.enemies.filter(e => e.hp <= 0);
    this.enemies = this.enemies.filter(e => e.hp > 0);
    for (const e of dead) {
      this.kills++; if (e.boss) this.bossKills++;
      if (this.expOrbs.length >= 500) this.expOrbs.shift();
      this.expOrbs.push(new ExpOrb(e.x, e.y, e.expValue));
      this.createParticles(e.x, e.y, '#fbbf24', 5);
      if (e.boss || this.random() < 0.12) {
        const types = ['heal', 'coffee', 'shield', 'ammo'];
        this.pickups.push({ x: e.x, y: e.y, kind: e.boss ? 'heal' : types[Math.floor(this.random() * 4)], life: 25 });
      }
      if (e.splitter && e.type.splitInto) {
        const def = findEnemyDef(e.type.splitInto);
        if (def) for (let i = 0; i < (e.type.splitCount || 2) && this.enemies.length < this.enemyLimit; i++) {
          const difficulty = difficultyAt(this.time);
          const child = new Enemy(e.x + i * 16, e.y, def, difficulty.hp, difficulty.damage);
          child.speed *= difficulty.speed;
          this.enemies.push(child);
        }
      }
    }
    if (dead.some(e => e.boss)) {
      this.recoveryUntil = this.time + BOSS_RECOVERY_SECONDS;
      // Retreat is not a kill: no score or XP for the dismissed support enemies.
      this.enemies = this.enemies.filter(e => e.boss);
      this.enemyProjectiles = []; this.bossShots = []; this.hazards = [];
      this.projectiles = []; this.mines = [];
      this.spawnTimer = 2;
      for (const boss of this.enemies) { boss.telegraph = null; boss.attackTimer = 2; }
    }
  }
  applyPickup(kind) {
    if (kind === 'heal') this.player.heal(35);
    if (kind === 'coffee') this.speedUntil = this.time + 8;
    if (kind === 'shield') this.shieldUntil = this.time + 6;
    if (kind === 'ammo') {
      this.specialReadyAt = this.time;
      for (const w of this.player.weapons) w.cooldown = 0;
    }
    const labels = { heal: '+35 salute', coffee: 'Velocità · 8 s', shield: 'Scudo · 6 s', ammo: 'Speciale ricaricato' };
    this.createFloatingText(labels[kind], this.player.x, this.player.y - 40, '#fef3c7');
  }
  offerUpgrades() {
    const pool = [];
    for (const [id, [label]] of Object.entries(WEAPON_LABELS)) {
      const owned = this.player.weapons.find(w => w.id === id);
      if ((!owned && this.player.weapons.length < CONFIG.MAX_WEAPONS) || (owned && owned.level < UPGRADE_CAP)) {
        const level = (owned?.level || 0) + 1;
        pool.push({ id, label, description: upgradeDescription(id, level), kind: 'weapon', level, maxLevel: UPGRADE_CAP });
      }
    }
    for (const [id, [label]] of Object.entries(PASSIVE_LABELS)) {
      const count = this.player.passives[id]?.count || 0;
      if (count < UPGRADE_CAP) pool.push({ id, label, description: upgradeDescription(id, count + 1), kind: 'passive', level: count + 1, maxLevel: UPGRADE_CAP });
    }
    // Healing remains a useful choice after the original weapon/passive caps.
    pool.push({ id: 'heal', label: 'Riprendi fiato', description: 'Recupera 40 punti salute.', kind: 'heal', level: 0, maxLevel: 0 });
    this.choices = [];
    // Make a visibly different shot available at the first level-up.
    if (this.player.level === 2 && !this.player.weapons.some(w => w.def.type === 'pattern')) {
      const patterns = pool.filter(c => SHOT_WEAPONS.some(w => w.id === c.id));
      if (patterns.length) {
        const pick = patterns[Math.floor(this.random() * patterns.length)];
        this.choices.push(pick); pool.splice(pool.indexOf(pick), 1);
      }
    }
    while (pool.length && this.choices.length < 3) this.choices.push(pool.splice(Math.floor(this.random() * pool.length), 1)[0]);
    this.state = 'upgrade'; this.input.clear();
  }
  choose(id) {
    if (this.state !== 'upgrade') return;
    const choice = this.choices.find(c => c.id === id);
    if (!choice) return;
    if (choice.kind === 'weapon') {
      const owned = this.player.weapons.find(w => w.id === id);
      if (owned) owned.levelUp();
      else this.player.weapons.push(this.makeWeapon([...Object.values(WEAPONS), ...SHOT_WEAPONS].find(w => w.id === id)));
    } else if (choice.kind === 'passive') this.player.addPassive(Object.values(PASSIVES).find(p => p.id === id));
    else this.player.heal(40);
    this.pendingLevels--;
    this.choices = [];
    this.state = 'playing';
    if (this.pendingLevels > 0) this.offerUpgrades();
  }
  update(dt) {
    if (this.state !== 'playing') return;
    dt = Math.min(CONFIG.DT_CLAMP, Math.max(0, dt));
    if (this.recovering || this.enemies.some(e => e.boss && e.hp > 0)) this.waveDelay += dt;
    this.time += dt;
    this.stageMods = { playerSpeedMult: this.time < this.speedUntil ? 1.5 : 1 };
    if (this.time < this.shieldUntil) { this.player.invincible = true; this.player.invincibleTimer = 0.1; }
    const move = this.input.getMoveVector();
    if (Math.hypot(move.x, move.y) > 0.01) this.shootingPose = shootingPose(move.x, move.y);
    this.spatial.insertAll(this.enemies.filter(e => e.hp > 0));
    this.player.update(dt, this);
    this.player.x = Math.max(80, Math.min(WORLD.width - 80, this.player.x));
    this.player.y = Math.max(90, Math.min(WORLD.height - 90, this.player.y));
    this.collectDeaths();
    this.updateWaves(dt);
    this.enemyDmgMult = Math.min(2.5, difficultyAt(this.time).damage);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || this.recovering) continue;
      if (enemy.boss) updateBoss(enemy, this, dt);
      else {
        enemy.update(dt, this);
        if (enemy.type.zigzag && enemy.slowTimer <= 0) {
          const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x) + Math.PI / 2;
          const sway = Math.sin((this.time - enemy.spawnedAt) * 4 + enemy.motionSeed) * 80 * dt;
          enemy.x += Math.cos(angle) * sway; enemy.y += Math.sin(angle) * sway;
        }
      }
      if (enemy.hp > 0 && Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) < enemy.size + this.player.size) this.player.takeDamage(enemy.damage, this);
    }
    if (!this.recovering) updateBossAttacks(this, dt);
    this.spatial.insertAll(this.enemies.filter(e => e.hp > 0));
    for (const p of this.projectiles) {
      p.update(dt, this);
      if (p.shouldRemove) continue;
      for (const e of this.spatial.queryRect(p.x, p.y, p.size + 70)) {
        if (e.hp <= 0 || p.hitEnemies.has(e) || Math.hypot(p.x - e.x, p.y - e.y) >= p.size + e.size) continue;
        e.takeDamage(p.damage); p.hitEnemies.add(e);
        if (!p.piercing) { p._onEnd(this); p.shouldRemove = true; break; }
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.shouldRemove).slice(-350);
    for (const p of this.enemyProjectiles) p.update(dt, this);
    this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.shouldRemove).slice(-300);
    for (const mine of this.mines) mine.update(dt, this);
    this.mines = this.mines.filter(m => !m.shouldRemove);
    this.collectDeaths();
    const previousLevel = this.player.level;
    for (const orb of this.expOrbs) orb.update(dt, this);
    this.expOrbs = this.expOrbs.filter(o => !o.shouldRemove);
    this.pendingLevels += this.player.level - previousLevel;
    this.pickups = this.pickups.filter(p => {
      p.life -= dt;
      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 30) { this.applyPickup(p.kind); return false; }
      return p.life > 0;
    });
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => p.life > 0);
    for (const text of this.floatingTexts) text.update(dt);
    this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
    if (this.player.dead) this.finish();
    else if (this.pendingLevels > 0) this.offerUpgrades();
  }
  snapshot() {
    const bosses = this.enemies.filter(e => e.boss && e.hp > 0).map(boss => ({ id: boss.id, name: boss.type.name, hp: Math.ceil(boss.hp), maxHp: Math.ceil(boss.maxHp), attacking: Boolean(boss.telegraph), enraged: boss.hp < boss.maxHp * 0.5 }));
    return {
      wave: { number: this.wave.number, title: this.recovering ? 'Riprendi fiato' : this.wave.title, breather: this.recovering || this.wave.breather, secondsLeft: this.recovering ? Math.ceil(this.recoveryUntil - this.time) : this.wave.secondsLeft },
      boss: bosses[0] || null, bosses,
      state: this.state, seconds: Math.floor(this.time), kills: this.kills,
      hp: Math.ceil(this.player.hp), maxHp: Math.ceil(this.player.maxHp), level: this.player.level,
      exp: this.player.exp, expToNext: this.player.expToNext,
      specialIn: Math.max(0, Math.ceil(this.specialReadyAt - this.time)),
      shield: Math.max(0, Math.ceil(this.shieldUntil - this.time)), speed: Math.max(0, Math.ceil(this.speedUntil - this.time)),
      xp: rewardForRun(this.kills, this.time), score: scoreForRun(this.kills, this.time), choices: this.choices,
      specialCharge: Math.max(0, Math.min(1, 1 - (this.specialReadyAt - this.time) / SPECIAL_COOLDOWN)),
    };
  }
}
