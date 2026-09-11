import { drawShockwave } from './special-effect.js';
import { WORLD, playerFrame, enemyFrame, enemySprite, carrotTier, enemyRotation, enemyHasShadow } from './assets.js';

function sprite(ctx, image, frame, x, y, size, rotation = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  ctx.drawImage(image, frame * 128, 0, 128, 128, -size / 2, -size / 2, size, size);
  ctx.restore();
}
function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
}
export function renderGame(ctx, game, images, width, height) {
  const cameraX = Math.max(0, Math.min(WORLD.width - width, game.player.x - width / 2));
  const cameraY = Math.max(0, Math.min(WORLD.height - height, game.player.y - height / 2));
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  ctx.save(); ctx.translate(-cameraX, -cameraY);
  // 1. Ground. Both map layers share exactly the same projection and bounds.
  ctx.drawImage(images.down, 0, 0, WORLD.width, WORLD.height);
  // 2. Pickups, projectiles, actors and effects all live below the canopy.
  for (const hazard of game.hazards) {
    const charge = Math.max(0, Math.min(1, 1 - (hazard.at - game.time) / 1.8));
    ctx.save(); ctx.fillStyle = '#a0cb7228'; ctx.strokeStyle = '#c7e89a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 0.4 + charge * 0.4;
    ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.radius * charge, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  for (const orb of game.expOrbs) {
    const size = carrotTier(orb.value) === 'purple' ? 38 : carrotTier(orb.value) === 'gold' ? 30 : 24;
    ctx.drawImage(images[carrotTier(orb.value)], orb.x - size / 2, orb.y - size / 2, size, size);
  }
  for (const pickup of game.pickups) {
    circle(ctx, pickup.x, pickup.y, 19, '#132a2480');
    ctx.drawImage(images[pickup.kind], pickup.x - 18, pickup.y - 18, 36, 36);
  }
  for (const mine of game.mines) mine.render(ctx);
  for (const w of game.player.weapons) w.renderExtras(ctx);
  for (const p of game.projectiles) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle || 0);
    ctx.fillStyle = p.color || '#ffefae';
    if (p.id === 'carrot_bomb') {
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    } else if (p.id === 'return_blade') {
      ctx.rotate(game.time * 12); ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI); ctx.lineTo(0, 0); ctx.fill();
    } else ctx.fillRect(-9, -3, 18, 6);
    ctx.fillStyle = '#c0752c'; ctx.fillRect(-9, -3, 5, 6); ctx.restore();
  }
  for (const p of game.enemyProjectiles) {
    circle(ctx, p.x, p.y, p.size + 2, '#1c1918'); circle(ctx, p.x, p.y, p.size, p.color || '#fb7185');
    circle(ctx, p.x - 1, p.y - 1, Math.max(2, p.size * 0.35), '#fff1cb');
  }
  const actors = [...game.enemies, game.player].sort((a, b) => a.y - b.y);
  for (const actor of actors) {
    const isPlayer = actor === game.player;
    const size = isPlayer ? 100 : actor.boss ? 156 : enemySprite(actor).startsWith('heavy') ? 116 : 92;
    if (actor.x + size < cameraX || actor.x - size > cameraX + width || actor.y + size < cameraY || actor.y - size > cameraY + height) continue;
    ctx.save();
    if (isPlayer || enemyHasShadow(actor)) {
      ctx.fillStyle = '#121d2444'; ctx.beginPath(); ctx.ellipse(actor.x, actor.y + 20, isPlayer ? 17 : actor.size, 7, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (isPlayer) {
      if (actor.invincible) ctx.globalAlpha = Math.floor(game.time * 15) % 2 ? 0.65 : 1;
      const move = game.input.getMoveVector();
      sprite(ctx, images.player, playerFrame(game.time, game.specialAt, game.shootingPose, Math.hypot(move.x, move.y) > 0.01), actor.x, actor.y, size);
    } else {
      if (actor.flashTimer > 0) ctx.globalAlpha = 0.65;
      sprite(ctx, images[enemySprite(actor)], enemyFrame(game.time), actor.x, actor.y, size, enemyRotation(actor, game.player));
      if (actor.hp < actor.maxHp) {
        ctx.fillStyle = '#271e23'; ctx.fillRect(actor.x - 19, actor.y - size / 2 + 10, 38, 4);
        ctx.fillStyle = actor.boss ? '#fb7185' : '#e5ad4e'; ctx.fillRect(actor.x - 19, actor.y - size / 2 + 10, 38 * Math.max(0, actor.hp / actor.maxHp), 4);
      }
    }
    if (!isPlayer && actor.telegraph) {
      ctx.strokeStyle = actor.type.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(actor.x, actor.y, size * 0.43, 0, Math.PI * 2); ctx.stroke();
      if (actor.type.pattern === 'barrage') {
        ctx.globalAlpha = 0.6; ctx.setLineDash([8, 8]);
        for (const offset of [-0.42, 0, 0.42]) {
          const angle = actor.telegraph.angle + offset;
          ctx.beginPath(); ctx.moveTo(actor.x, actor.y); ctx.lineTo(actor.x + Math.cos(angle) * 350, actor.y + Math.sin(angle) * 350); ctx.stroke();
        }
      }
    }
    if (!isPlayer && actor.dasher && actor.dashTimer < 0.45 && actor.dashActive <= 0) {
      ctx.strokeStyle = '#f3ce82'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(actor.x, actor.y, 29, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  if (game.shieldUntil > game.time) {
    ctx.strokeStyle = '#a5e8ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(game.player.x, game.player.y, 38, 0, Math.PI * 2); ctx.stroke();
  }
  drawShockwave(ctx, game.specialOrigin, game.time - game.specialAt, game.reducedMotion);
  for (const p of game.particles) p.render(ctx);
  // 3. Foreground trees occlude every world entity, including newly spawned foes.
  ctx.drawImage(images.up, 0, 0, WORLD.width, WORLD.height);
  // Text feedback is HUD, not a world entity.
  for (const text of game.floatingTexts) text.render(ctx);
  ctx.restore();
}
