const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = file => import(pathToFileURL(path.resolve(__dirname, '../lib/bullet', file)).href);
const canopy = [{ x: 24, y: 24 }, { x: 2790, y: 24 }, { x: 24, y: 1500 }];
const still = () => ({ getMoveVector: () => ({ x: 0, y: 0 }), clear() {} });
async function ready() {
  const { CoopGame } = await load('coop-game.js');
  const game = new CoopGame(canopy, () => 0.25); game.start();
  game.input = still(); game.contexts.forEach(c => { c.input = still(); });
  game.enemies = []; game.spawnTimer = 1000;
  return game;
}
test('two independent players move and use separate special cooldowns', async () => {
  const game = await ready();
  const before = game.players.map(p => p.x);
  game.contexts[1].input.getMoveVector = () => ({ x: 1, y: 0 });
  game.update(1 / 60);
  assert.equal(game.players[0].x, before[0]); assert.ok(game.players[1].x > before[1]);
  assert.equal(game.specialFor(1), true);
  assert.equal(game.snapshotFor(0).specialIn, 0); assert.ok(game.snapshotFor(1).specialIn > 0);
  assert.equal(game.specialFor(0), true);
  assert.equal(game.player, game.players[0]);
});
test('enemies target the nearer partner and the run ends only when both fall', async () => {
  const game = await ready();
  const { FOES } = await load('waves.js');
  const enemy = game.spawn(FOES.minion);
  enemy.x = game.players[1].x; enemy.y = game.players[1].y;
  game.players.forEach(p => { p.weapons = []; });
  game.update(1 / 60);
  assert.equal(game.players[0].hp, game.players[0].maxHp);
  assert.ok(game.players[1].hp < game.players[1].maxHp);
  game.players[0].hp = 0; game.players[0].dead = true;
  game.update(1 / 60); assert.equal(game.state, 'playing');
  game.players[1].hp = 0; game.players[1].dead = true;
  game.update(1 / 60); assert.equal(game.state, 'over');
});
test('a surviving player can revive a teammate after three seconds nearby', async () => {
  const game = await ready();
  game.players[1].x = game.players[0].x + 40; game.players[1].hp = 0; game.players[1].dead = true;
  for (let i = 0; i < 181; i++) game.update(1 / 60);
  assert.equal(game.players[1].dead, false); assert.ok(game.players[1].hp > 0);
});
test('guest collects shared XP and upgrades apply to both weapons', async () => {
  const game = await ready();
  const { ExpOrb } = await load('core/entities.js');
  const guest = game.players[1];
  game.expOrbs.push(new ExpOrb(guest.x, guest.y, 100));
  game.update(1 / 60);
  assert.equal(game.state, 'upgrade');
  assert.equal(game.snapshotFor(0).level, game.snapshotFor(1).level);
  const choice = game.choices.find(c => c.kind === 'weapon');
  assert.ok(choice); game.choose(choice.id);
  assert.deepEqual(game.players[0].weapons.map(w => [w.id, w.level]), guest.weapons.map(w => [w.id, w.level]));
  assert.equal(game.state, 'playing');
});
test('wire snapshot roundtrips full visual state without class instances or circular references', async () => {
  const game = await ready();
  const { encodeCoop, decodeCoop, normalizeMove, interpolateCoop } = await load('coop-wire.js');
  const { renderGame } = await load('renderer.js');
  const { WEAPONS } = await load('core/data.js');
  game.players[1].weapons.push(game.makeWeapon(WEAPONS.ORBIT ?? Object.values(WEAPONS).find(w => w.type === 'orbit')));
  game.update(1 / 60); game.createFloatingText('ciao', 100, 100, '#fff');
  const encoded = JSON.parse(JSON.stringify(encodeCoop(game, 1, 'test-run')));
  const scene = decodeCoop(encoded);
  assert.equal(scene.viewIndex, 1); assert.equal(scene.players.length, 2);
  assert.equal(scene.snapshot.hp, game.players[1].hp);
  const ctx = new Proxy({}, { get: (_, key) => key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
  const images = new Proxy({}, { get: () => ({}) });
  assert.doesNotThrow(() => renderGame(ctx, scene, images, 480, 600));
  const next = decodeCoop(JSON.parse(JSON.stringify(encoded))); next.players[1].x += 80;
  assert.equal(interpolateCoop(scene, next, 0.5).players[1].x, scene.players[1].x + 40);
  assert.deepEqual(normalizeMove({ x: Infinity, y: 0 }), { x: 0, y: 0 });
  assert.ok(Math.hypot(...Object.values(normalizeMove({ x: 10, y: 10 }))) <= 1);
});

test('two runtime clients share a run, accept guest input and pause on connection loss', async () => {
  const saved = Object.fromEntries(['window', 'document', 'Image', 'HTMLElement', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'].map(key => [key, globalThis[key]]));
  let now = 100, nextFrame = 0, frames = new Map(), queue = [], dropGuest = false, lastPacket;
  const ctx = new Proxy({}, { get: (_, key) => key === 'getImageData' ? () => ({ data: new Proxy({}, { get: () => 255 }) }) : key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
  class Element extends EventTarget {
    constructor() { super(); this.style = { setProperty() {} }; }
    getContext() { return ctx; } getBoundingClientRect() { return { width: 480, height: 600, left: 0, top: 0 }; }
    focus() {} contains() { return true; } closest() { return null; } hasPointerCapture() { return false; }
  }
  globalThis.HTMLElement = Element;
  globalThis.window = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false }), devicePixelRatio: 1 });
  globalThis.document = Object.assign(new EventTarget(), { createElement: () => new Element(), hidden: false });
  globalThis.Image = class { set src(value) { this.naturalWidth = value.endsWith('/player.png') ? 3072 : 512; this.naturalHeight = 128; } async decode() {} };
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  globalThis.requestAnimationFrame = fn => { frames.set(++nextFrame, fn); return nextFrame; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  globalThis.performance = { now: () => now };
  const handlers = [null, null];
  const connection = index => ({ role: index ? 'guest' : 'host', room: { id: 'test' },
    listen(fn) { handlers[index] = fn; return () => { handlers[index] = null; }; },
    send(packet) { if (index && dropGuest) return; const copy = JSON.parse(JSON.stringify(packet)); if (!index) lastPacket = copy; queue.push(() => handlers[1 - index]?.(copy)); },
  });
  const step = count => { for (let i = 0; i < count; i++) { now += 1000 / 60; const current = [...frames.values()]; frames.clear(); current.forEach(fn => fn(now)); const messages = queue; queue = []; messages.forEach(fn => fn()); } };
  let host, guest;
  try {
    const { mountCoopGame } = await load('coop-runtime.js');
    let hostState, guestState;
    const hostSurface = new Element(), guestSurface = new Element();
    host = await mountCoopGame(new Element(), hostSurface, state => { hostState = state; }, new AbortController().signal, new Element(), connection(0));
    guest = await mountCoopGame(new Element(), guestSurface, state => { guestState = state; }, new AbortController().signal, new Element(), connection(1));
    step(20); assert.equal(hostState.peerConnected, true); assert.equal(guestState.peerConnected, true);
    host.start(); step(20);
    assert.equal(hostState.state, 'playing'); assert.equal(guestState.state, 'playing');
    assert.equal(hostState.runId, guestState.runId);
    const guestX = lastPacket.players[1].x;
    const key = new Event('keydown'); Object.defineProperties(key, { code: { value: 'KeyD' }, repeat: { value: false } }); guestSurface.dispatchEvent(key);
    step(60); assert.ok(lastPacket.players[1].x > guestX + 50);
    guest.special(); step(12);
    assert.ok(guestState.specialIn > 0); assert.equal(hostState.specialIn, 0);
    guest.pause(); step(12); assert.equal(hostState.state, 'paused'); assert.equal(guestState.state, 'paused');
    host.pause(); step(12); assert.equal(hostState.state, 'playing');
    dropGuest = true; step(200); assert.equal(hostState.state, 'paused'); assert.equal(hostState.peerConnected, false);
    dropGuest = false; step(20); host.finish(); step(20);
    assert.equal(hostState.state, 'over'); assert.equal(guestState.state, 'over');
    const oldRun = guestState.runId; host.start(); step(20);
    assert.equal(guestState.state, 'playing'); assert.notEqual(guestState.runId, oldRun);
  } finally {
    host?.destroy(); guest?.destroy();
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});
