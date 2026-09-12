import { Mine, OrbitShard, Particle, FloatingText } from './core/entities.js';
const fields = (object, names) => Object.fromEntries(names.split(' ').map(key => [key, object[key]]).filter(([, value]) => value !== undefined));
const point = object => fields(object, 'x y size');
const restore = (Type, data) => Object.assign(Object.create(Type.prototype), data);
const ids = new WeakMap();
let nextId = 1;
const networkId = object => { if (!ids.has(object)) ids.set(object, nextId++); return ids.get(object); };
export function encodeCoop(game, sequence, runId) {
  return {
    sequence, runId, time: game.time, state: game.state,
    players: game.players.map(player => ({ ...fields(player, 'x y hp maxHp size invincible dead'),
      shards: player.weapons.flatMap(w => w._shards ?? []).map(point) })),
    contexts: game.contexts.map(c => ({ ...fields(c, 'specialAt specialOrigin shieldUntil shootingPose'), move: c.input.getMoveVector() })),
    enemies: game.enemies.map(e => ({ netId: networkId(e), ...fields(e, 'x y size hp maxHp boss id flashTimer telegraph dasher dashTimer dashActive'), type: fields(e.type, 'sprite color pattern') })),
    projectiles: game.projectiles.map(p => fields(p, 'x y angle color id')),
    enemyProjectiles: game.enemyProjectiles.map(p => ({ ...point(p), color: p.color })),
    expOrbs: game.expOrbs.map(p => ({ ...point(p), value: p.value })),
    pickups: game.pickups.map(p => ({ ...point(p), kind: p.kind })),
    hazards: game.hazards.map(h => fields(h, 'x y radius at')),
    mines: game.mines.map(m => fields(m, 'x y radius fuse maxFuse')),
    particles: game.particles.map(p => fields(p, 'x y life maxLife color size')),
    floatingTexts: game.floatingTexts.map(p => fields(p, 'x y text color life size weight crit')),
    snapshot: game.snapshotFor(1),
  };
}
export function decodeCoop(packet, reducedMotion = false) {
  const players = packet.players.map(p => ({ ...p, weapons: [{ renderExtras(ctx) {
    for (const shard of p.shards) restore(OrbitShard, shard).render(ctx);
  } }] }));
  return { ...packet, players, player: players[0], viewIndex: 1, reducedMotion,
    input: { getMoveVector: () => packet.contexts[0].move },
    contexts: packet.contexts.map(c => ({ ...c, input: { getMoveVector: () => c.move } })),
    mines: packet.mines.map(m => restore(Mine, m)),
    particles: packet.particles.map(p => restore(Particle, p)),
    floatingTexts: packet.floatingTexts.map(p => restore(FloatingText, p)),
  };
}
export function normalizeMove(move) {
  if (!move || !Number.isFinite(move.x) || !Number.isFinite(move.y)) return { x: 0, y: 0 };
  const length = Math.max(1, Math.hypot(move.x, move.y));
  return { x: move.x / length, y: move.y / length };
}

export function interpolateCoop(previous, next, alpha) {
  const blend = (before, after) => {
    if (!before || Math.hypot(before.x - after.x, before.y - after.y) > 180) return after;
    return { ...after, x: before.x + (after.x - before.x) * alpha, y: before.y + (after.y - before.y) * alpha };
  };
  const players = next.players.map((player, i) => blend(previous?.players[i], player));
  const oldEnemies = new Map(previous?.enemies.map(e => [e.netId, e]) ?? []);
  return { ...next, players, player: players[0], enemies: next.enemies.map(e => blend(oldEnemies.get(e.netId), e)) };
}
