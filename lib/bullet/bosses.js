import { EnemyProjectile } from './core/entities.js';
import { WORLD } from './assets.js';
import { FOES } from './waves.js';

const TAU = Math.PI * 2;
function shot(game, boss, angle, speed, color, delay = 0, seeking = false) {
  if (game.bossShots.length >= 180) return;
  game.bossShots.push({ owner: boss, at: game.time + delay, angle, speed, color, seeking });
}
function shootPattern(boss, game) {
  const aim = boss.telegraph.angle;
  const enraged = boss.hp < boss.maxHp * 0.5;
  if (boss.type.pattern === 'barrage') {
    // Three aimed salvos, locked at the warning direction so sidestepping works.
    for (let salvo = 0; salvo < 3; salvo++) {
      const count = enraged ? 9 : 7;
      for (let i = 0; i < count; i++) shot(game, boss, aim + (i - (count - 1) / 2) * 0.14, 215 + salvo * 18, '#f4cd80', salvo * 0.24);
    }
  } else if (boss.type.pattern === 'spiral') {
    if (boss.attackCount % 2 === 0) {
      // Twin rotating streams. Their gaps keep moving; no homing correction.
      for (let tick = 0; tick < (enraged ? 20 : 14); tick++) {
        for (let arm = 0; arm < 2; arm++) shot(game, boss, aim + tick * 0.31 + arm * Math.PI, 165, '#f3a16f', tick * 0.11);
      }
    } else {
      // Broken rings with a persistent escape corridor, offset from the player.
      for (let ring = 0; ring < 2; ring++) for (let i = 2; i < 18; i++) shot(game, boss, aim + 0.5 + i * TAU / 20, 145 + ring * 35, '#f3a16f', ring * 0.35);
    }
  } else {
    // Poison globules follow briefly, then commit to a straight trajectory.
    for (let i = -2; i <= 2; i++) shot(game, boss, aim + i * 0.23, 140, '#b5dd78', 0, true);
    if (boss.attackCount % 2 === 0) for (let i = 0; i < 2; i++) game.spawn(FOES.minion2, { side: i ? 'east' : 'west' });
  }
  boss.attackCount++;
}
export function updateBoss(boss, game, dt) {
  if (boss.hp <= 0) return;
  boss.attackCount ??= 0;
  boss.attackTimer ??= 1.4;
  boss.flashTimer = Math.max(0, boss.flashTimer - dt);
  boss.slowTimer = Math.max(0, boss.slowTimer - dt);
  const dx = game.player.x - boss.x, dy = game.player.y - boss.y;
  const distance = Math.hypot(dx, dy);
  const keep = boss.type.pattern === 'venom' ? 330 : 290;
  const direction = distance > keep + 35 ? 1 : distance < keep - 70 ? -0.5 : 0;
  const slow = boss.slowTimer > 0 ? 1 - boss.slowPct : 1;
  const speed = boss.speed * direction * slow * (boss.telegraph ? 0.25 : 1);
  if (distance > 1) {
    boss.x = Math.max(50, Math.min(WORLD.width - 50, boss.x + dx / distance * speed * dt));
    boss.y = Math.max(50, Math.min(WORLD.height - 50, boss.y + dy / distance * speed * dt));
  }
  if (boss.telegraph) {
    if (game.time >= boss.telegraph.until) {
      shootPattern(boss, game); boss.telegraph = null;
      boss.attackTimer = boss.hp < boss.maxHp * 0.5 ? 1.6 : 2.6;
    }
    return;
  }
  if (distance > 650) return;
  boss.attackTimer -= dt;
  if (boss.attackTimer > 0) return;
  boss.telegraph = { angle: Math.atan2(dy, dx), until: game.time + 0.85 };
  if (boss.type.pattern === 'venom') {
    const move = game.input.getMoveVector();
    for (let i = 0; i < 3; i++) {
      game.hazards.push({ owner: boss, x: Math.max(75, Math.min(WORLD.width - 75, game.player.x + move.x * i * 95)), y: Math.max(75, Math.min(WORLD.height - 75, game.player.y + move.y * i * 95 + (i - 1) * 80)), radius: 65, at: game.time + 1.4 + i * 0.15 });
    }
  }
}
export function updateBossAttacks(game, dt) {
  game.bossShots = game.bossShots.filter(shot => {
    if (shot.owner.hp <= 0) return false;
    if (shot.at > game.time) return true;
    if (game.enemyProjectiles.length < 300) {
      const p = new EnemyProjectile(shot.owner.x, shot.owner.y, shot.angle, shot.speed, 16);
      p.life = 5; p.color = shot.color; p.size = shot.seeking ? 10 : 6;
      p.seekRemaining = shot.seeking ? 0.7 : 0;
      game.enemyProjectiles.push(p);
    }
    return false;
  });
  for (const p of game.enemyProjectiles) if (p.seekRemaining > 0) {
    p.seekRemaining -= dt;
    const target = game.nearestPlayer?.(p) ?? game.player;
    const desired = Math.atan2(target.y - p.y, target.x - p.x);
    const current = Math.atan2(p.vy, p.vx);
    const delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
    const angle = current + Math.max(-dt * 1.1, Math.min(dt * 1.1, delta));
    const speed = Math.hypot(p.vx, p.vy); p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed;
  }
  game.hazards = game.hazards.filter(h => {
    if (h.owner.hp <= 0) return false;
    if (game.time < h.at) return true;
    for (const player of game.players ?? [game.player]) {
      if (Math.hypot(player.x - h.x, player.y - h.y) < h.radius + player.size) player.takeDamage(24, game);
    }
    game.createParticles(h.x, h.y, '#b5dd78', 18);
    for (let i = 0; i < 8 && game.enemyProjectiles.length < 300; i++) {
      const p = new EnemyProjectile(h.x, h.y, i * TAU / 8, 115, 10); p.color = '#b5dd78'; game.enemyProjectiles.push(p);
    }
    return false;
  });
}
