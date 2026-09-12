const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = file => import(pathToFileURL(path.resolve(__dirname, '../lib/bullet', file)).href);
const ready = Promise.all([load('game.js'), load('assets.js'), load('core/entities.js'), load('core/data.js')]);
const canopy = [{ x: 24, y: 24 }, { x: 1368, y: 24 }, { x: 24, y: 728 }, { x: 1368, y: 728 }];

function rng(seed = 43) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }

test('shooting poses stay fixed over time, use no walk frames and match special direction', async () => {
  const [, { playerFrame, shootingPose, enemyFrame }] = await ready;
  for (const [x, y, pose] of [[-1, 1, 12], [0, 1, 13], [1, 1, 14], [-1, -1, 15], [0, -1, 16], [1, -1, 17]]) {
    assert.equal(shootingPose(x, y), pose);
    for (let i = 0; i < 120; i++) {
      assert.equal(playerFrame(i / 10, -100, pose), pose);
      assert.ok(enemyFrame(i / 10) >= 0 && enemyFrame(i / 10) <= 3);
    }
    assert.equal(playerFrame(10, 10, pose), pose + 6);
    assert.equal(playerFrame(10.47, 10, pose), pose + 6);
    assert.equal(playerFrame(10.5, 10, pose), pose);
  }
  assert.equal(shootingPose(0, 0), 13);
});

test('all enemy orientations rotate the original upward-facing sprite toward the player', async () => {
  const [, { enemyRotation }] = await ready;
  for (const [x, y] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, 1], [-1, -1]]) {
    const angle = enemyRotation({ x: 10, y: 10 }, { x: 10 + x, y: 10 + y });
    const length = Math.hypot(x, y);
    assert.ok(Math.abs(Math.sin(angle) - x / length) < 0.00001);
    assert.ok(Math.abs(-Math.cos(angle) - y / length) < 0.00001);
  }
});

test('releasing movement holds the last shooting direction despite continuous automatic fire', async () => {
  const [{ BulletGame }, , { Enemy }, { ENEMIES }] = await ready;
  const game = new BulletGame(canopy); game.start(); game.spawnTimer = 100;
  game.enemies = [new Enemy(game.player.x + 200, game.player.y, { ...ENEMIES.GOLEM, hp: 10000, speed: 0 }, 1, 1)];
  game.input.getMoveVector = () => ({ x: -1, y: -1 }); game.update(1 / 60);
  assert.equal(game.shootingPose, 15);
  game.input.getMoveVector = () => ({ x: 0, y: 0 });
  for (let i = 0; i < 120; i++) { game.update(1 / 60); assert.equal(game.shootingPose, 15); }
  assert.ok(game.attackAt > 0.5);
});

test('all source enemies and bosses map to supplied sprites; carrot tiers are distinct', async () => {
  const [, { enemySprite, carrotTier, ASSETS }, , { ENEMIES, BOSSES }] = await ready;
  for (const def of [...Object.values(ENEMIES), ...Object.values(BOSSES)]) assert.ok(ASSETS[enemySprite(def)]);
  assert.equal(carrotTier(10), 'orange'); assert.equal(carrotTier(50), 'gold'); assert.equal(carrotTier(150), 'purple');
  const sharp = require('sharp');
  for (const key of ['player', 'minion', 'minion2', 'fast', 'fast2', 'fast3', 'heavy', 'heavy2', 'stealth', 'boss', 'boss2', 'boss3']) {
    const meta = await sharp(path.resolve(__dirname, '../public/bullet', ASSETS[key])).metadata();
    assert.equal(meta.height, 128); assert.equal(meta.width, key === 'player' ? 3072 : 512);
  }
  const up = await sharp(path.resolve(__dirname, '../public/bullet/background_up.png')).raw().toBuffer({ resolveWithObject: true });
  assert.equal(up.data[(768 * up.info.width + 1408) * 4 + 3], 0, 'arena centre must remain transparent');
});

test('enemy wave spawns use covered points away from the player', async () => {
  const [{ BulletGame }] = await ready;
  const game = new BulletGame(canopy, rng()); game.start();
  assert.equal(game.enemies.length, 5);
  for (const enemy of game.enemies) {
    assert.ok(canopy.some(p => p.x === enemy.x && p.y === enemy.y));
    assert.ok(Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) > 300);
  }
});

test('pause freezes gameplay, special and powerup timers; finishing is idempotent', async () => {
  const [{ BulletGame }] = await ready;
  const game = new BulletGame(canopy); game.start(); game.special(); game.applyPickup('coffee'); game.pause();
  const before = game.snapshot(); for (let i = 0; i < 300; i++) game.update(0.05);
  assert.deepEqual(game.snapshot(), before); assert.equal(game.special(), false);
  game.finish(); game.finish(); assert.equal(game.state, 'over');
  game.update(1); assert.equal(game.time, 0);
});

test('special damages nearby enemies, clears nearby hostile bullets, and respects cooldown', async () => {
  const [{ BulletGame }, , { Enemy, EnemyProjectile }, { ENEMIES }] = await ready;
  const game = new BulletGame(canopy); game.start();
  const near = new Enemy(game.player.x + 100, game.player.y, ENEMIES.GOLEM, 1, 1);
  const far = new Enemy(24, 24, ENEMIES.GOLEM, 1, 1); game.enemies = [near, far];
  game.enemyProjectiles = [new EnemyProjectile(game.player.x, game.player.y, 0, 10, 10), new EnemyProjectile(24, 24, 0, 10, 10)];
  assert.equal(game.special(), true); assert.ok(near.hp < near.maxHp); assert.equal(far.hp, far.maxHp);
  assert.equal(game.enemyProjectiles.length, 1); assert.equal(game.special(), false);
  game.applyPickup('ammo'); assert.equal(game.special(), true);
});

test('health, speed and shield pickups apply their real effects and expire', async () => {
  const [{ BulletGame }] = await ready;
  const game = new BulletGame(canopy); game.start(); game.enemies = []; game.spawnTimer = 100;
  game.player.hp = 80; game.applyPickup('heal'); assert.equal(game.player.hp, 100);
  game.applyPickup('coffee'); game.applyPickup('shield');
  game.input.getMoveVector = () => ({ x: 1, y: 0 });
  const x = game.player.x; game.update(0.05); assert.equal(game.player.x - x, 18);
  game.player.takeDamage(100, game); assert.equal(game.player.hp, 100);
  game.time = 9; game.update(0.05); game.update(0.05); game.update(0.05);
  game.player.takeDamage(10, game); assert.equal(game.player.hp, 90);
  assert.equal(game.snapshot().speed, 0); assert.equal(game.snapshot().shield, 0);
});

test('dead enemies cannot inflict contact damage and only drop XP once', async () => {
  const [{ BulletGame }, , { Enemy }, { ENEMIES }] = await ready;
  const game = new BulletGame(canopy); game.start(); game.spawnTimer = 100;
  const enemy = new Enemy(game.player.x, game.player.y, ENEMIES.ZOMBIE, 1, 1);
  enemy.hp = 0; game.enemies = [enemy]; game.update(1 / 60);
  assert.equal(game.player.hp, 100); assert.equal(game.kills, 1);
  game.update(1 / 60); assert.equal(game.kills, 1);
});

test('collected carrots open level choices and resume after a valid selection', async () => {
  const [{ BulletGame }, , { ExpOrb }] = await ready;
  const game = new BulletGame(canopy, rng()); game.start();
  game.expOrbs = [new ExpOrb(game.player.x, game.player.y, 450)]; game.update(1 / 60);
  assert.equal(game.state, 'upgrade'); assert.equal(game.player.level, 4);
  assert.ok(game.time < 1, 'first upgrade opens immediately, even before 20 seconds');
  game.choose('invalid'); assert.equal(game.state, 'upgrade');
  const time = game.time;
  for (let remaining = 2; remaining >= 0; remaining--) {
    game.choose(game.choices[0].id);
    assert.equal(game.pendingLevels, remaining);
    assert.equal(game.state, remaining ? 'upgrade' : 'playing');
    assert.equal(game.time, time, 'queued upgrades require no gameplay delay');
  }
  game.expOrbs = [new ExpOrb(game.player.x, game.player.y, game.player.expToNext)];
  game.update(1 / 60);
  assert.equal(game.state, 'upgrade', 'a subsequent level also opens immediately');

});

test('endless run continues past ten minutes, scores survival, and ends only on request', async () => {
  const [{ BulletGame, rewardForRun, scoreForRun }, , , { WEAPONS }] = await ready;
  const game = new BulletGame(canopy, rng()); game.start();
  game.player.weapons = ['KNIFE', 'MAGIC_WAND', 'ORBIT', 'MINE', 'FROST_NOVA'].map(key => game.makeWeapon(WEAPONS[key]));
  game.shieldUntil = 10000;
  let steps = 0;
  while (game.state !== 'over' && steps++ < 610 * 60) {
    if (game.state === 'upgrade') game.choose(game.choices[0].id);
    game.input.getMoveVector = () => ({ x: Math.cos(game.time / 7) * 0.5, y: Math.sin(game.time / 7) * 0.5 });
    if (steps % 720 === 0) game.special();
    game.shieldUntil = 10000;
    game.update(1 / 60);
    assert.ok(Number.isFinite(game.player.x) && Number.isFinite(game.player.y));
    assert.ok(game.projectiles.length <= 350 && game.enemyProjectiles.length <= 300);
  }
  assert.notEqual(game.state, 'over'); assert.ok(game.time > 600); assert.ok(game.kills > 0);
  assert.equal(rewardForRun(240, 360), 240, "six minutes and 240 kills award twice the former 120 XP");
  assert.equal(rewardForRun(0, 360), 120);
  assert.equal(rewardForRun(0, 0), 0);
  assert.equal(game.snapshot().xp, rewardForRun(game.kills, game.time));
  assert.equal(game.snapshot().score, scoreForRun(game.kills, game.time));
  game.finish(); assert.equal(game.state, 'over');
  game.start(); assert.equal(game.kills, 0); assert.equal(game.specialReadyAt, 0); assert.equal(game.player.level, 1);
});

test('renderer puts both map layers in the same projection around all actors', async () => {
  const [{ BulletGame }] = await ready;
  const { renderGame } = await load('renderer.js');
  const { ASSETS } = await load('assets.js');
  const images = Object.fromEntries([...Object.keys(ASSETS), 'gold', 'orange', 'purple'].map(key => [key, { key }]));
  const draws = [];
  const ctx = new Proxy({}, { get: (obj, key) => key === 'drawImage' ? (...args) => draws.push(args) : (() => {}), set: () => true });
  const game = new BulletGame(canopy); game.start();
  renderGame(ctx, game, images, 480, 600);
  assert.equal(draws[0][0].key, 'down'); assert.equal(draws.at(-1)[0].key, 'up');
  assert.deepEqual(draws[0].slice(1), draws.at(-1).slice(1));
  assert.ok(draws.slice(1, -1).some(call => call[0].key === 'player'));
});

test('controls prevent game-key scrolling only on the game surface and clean up after unmount', async () => {
  const { attachInput } = await load('input.js');
  const originals = { window: global.window, document: global.document, HTMLElement: global.HTMLElement };
  class Element extends EventTarget {
    constructor(tag = 'canvas') { super(); this.tag = tag; this.style = { setProperty() {} }; this.captured = null; }
    closest() { return this.tag === 'button' ? this : null; }
    contains(target) { return target === this; }
    focus() {}
    setPointerCapture(id) { this.captured = id; }
    hasPointerCapture(id) { return this.captured === id; }
    releasePointerCapture() { this.captured = null; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
  }
  try {
    global.window = new EventTarget(); global.document = new EventTarget(); global.HTMLElement = Element;
    const surface = new Element(), canvas = new Element(), joystick = new Element(); let specials = 0, pauses = 0;
    const input = attachInput(surface, canvas, joystick, { canMove: () => true, special: () => specials++, pause: () => pauses++ });
    const event = (type, props) => { const e = new Event(type, { cancelable: true }); for (const [k, v] of Object.entries(props)) Object.defineProperty(e, k, { value: v }); return e; };
    const right = event('keydown', { code: 'ArrowRight' }); surface.dispatchEvent(right);
    assert.equal(right.defaultPrevented, true); assert.deepEqual(input.getMoveVector(), { x: 1, y: 0 });
    const space = event('keydown', { code: 'Space', repeat: false }); surface.dispatchEvent(space); assert.equal(specials, 1);
    const buttonSpace = event('keydown', { code: 'Space', target: new Element('button') }); surface.dispatchEvent(buttonSpace);
    assert.equal(buttonSpace.defaultPrevented, false); assert.equal(specials, 1);
    surface.dispatchEvent(event('focusout', { relatedTarget: null }));
    assert.equal(pauses, 0, 'a mobile focus loss with no destination must not pause the game');
    window.dispatchEvent(new Event('blur')); assert.equal(pauses, 1); assert.deepEqual(input.getMoveVector(), { x: 0, y: 0 });
    canvas.dispatchEvent(event('pointerdown', { pointerId: 1, clientX: 95, clientY: 95 }));
    assert.deepEqual(input.getMoveVector(), { x: 0, y: 0 }, 'arena touches must not move the player');
    joystick.dispatchEvent(event('pointerdown', { pointerId: 1, clientX: 50, clientY: 50 }));
    joystick.dispatchEvent(event('pointermove', { pointerId: 1, clientX: 95, clientY: 95 }));
    assert.ok(Math.abs(Math.hypot(...Object.values(input.getMoveVector())) - 1) < 0.0001);
    const held = input.getMoveVector();
    joystick.dispatchEvent(event('pointerdown', { pointerId: 2, clientX: 0, clientY: 0 }));
    surface.dispatchEvent(event('keydown', { code: 'Space', repeat: false }));
    assert.deepEqual(input.getMoveVector(), held, 'special/second finger must not release the joystick');
    joystick.dispatchEvent(event('pointercancel', { pointerId: 1 })); assert.deepEqual(input.getMoveVector(), { x: 0, y: 0 });
    input.destroy(); const after = event('keydown', { code: 'ArrowDown' }); surface.dispatchEvent(after);
    assert.equal(after.defaultPrevented, false); window.dispatchEvent(new Event('blur')); assert.equal(pauses, 1);
  } finally {
    for (const [key, value] of Object.entries(originals)) { if (value === undefined) delete global[key]; else global[key] = value; }
  }
});

test('broad spatial queries preserve nearby and nearest results without scanning empty world cells', async () => {
  const { SpatialHash } = await load('core/spatial-hash.js');
  const hash = new SpatialHash(64);
  const items = [{ x: 12, y: 15 }, { x: 500, y: 600 }, { x: -30, y: 40 }];
  hash.insertAll(items);
  assert.deepEqual(new Set(hash.queryRect(0, 0, 9999)), new Set(items));
  assert.equal(hash.findNearestEnemy(490, 600, 9999), items[1]);
  assert.equal(hash.findNearestEnemy(490, 600, 5), null);
  assert.equal(hash.queryRect(2000, 2000, 20).length, 0);
  assert.equal(new Set(hash.queryRect(0, 0, 9999)).size, items.length);
});

test('movement uses directional walking pairs and returns to the exact shooting pose on release', async () => {
  const [, { playerFrame }] = await ready;
  for (const [pose, base] of [[12, 4], [13, 0], [14, 6], [15, 8], [16, 2], [17, 10]]) {
    assert.equal(playerFrame(1, -100, pose, true), base);
    assert.equal(playerFrame(1.13, -100, pose, true), base + 1);
    assert.equal(playerFrame(1.13, -100, pose, false), pose);
    assert.equal(playerFrame(1.13, 1, pose, true), pose + 6);
  }
});

test('world doubles both dimensions and only fast enemies cast shadows', async () => {
  const [, { WORLD, enemyHasShadow, enemySprite }, , { ENEMIES, BOSSES }] = await ready;
  assert.deepEqual(WORLD, { width: 2816, height: 1536 });
  const { CONFIG } = await load('core/config.js');
  assert.equal(CONFIG.ARENA_WIDTH, WORLD.width); assert.equal(CONFIG.ARENA_HEIGHT, WORLD.height);
  for (const def of [...Object.values(ENEMIES), ...Object.values(BOSSES)]) {
    assert.equal(enemyHasShadow(def), enemySprite(def) === 'fast');
  }
});

test('opening difficulty and XP progression are gentler, and cooldown clicks never pause', async () => {
  const [{ BulletGame }] = await ready;
  const game = new BulletGame(canopy, rng()); game.start();
  assert.equal(game.wave.number, 1); assert.equal(game.wave.boss, false);
  for (const enemy of game.enemies) {
    assert.ok(['wasp', 'rat'].includes(enemy.id));
    assert.ok(enemy.maxHp < enemy.type.hp); assert.ok(enemy.damage < enemy.type.damage);
    assert.ok(enemy.speed < enemy.type.speed);
  }
  game.player.gainExp(35); assert.equal(game.player.level, 1);
  game.player.gainExp(65); assert.equal(game.player.level, 2); assert.equal(game.player.expToNext, 135);
  assert.equal(game.special(), true);
  const before = game.snapshot();
  for (let i = 0; i < 10; i++) assert.equal(game.special(), false);
  assert.deepEqual(game.snapshot(), before); assert.equal(game.state, 'playing');
});

test('tiered weapons change projectile, orbit and mine counts and stop at tier three', async () => {
  const [{ BulletGame }, , { Enemy }, { WEAPONS, ENEMIES }] = await ready;
  const game = new BulletGame(canopy); game.start();
  const enemy = new Enemy(game.player.x + 100, game.player.y, ENEMIES.GOLEM, 100, 1);
  game.enemies = [enemy]; game.spatial.insertAll(game.enemies);
  for (const key of ['KNIFE', 'MAGIC_WAND', 'ORBIT', 'MINE', 'FROST_NOVA']) {
    const weapon = game.makeWeapon(WEAPONS[key]);
    for (let level = 1; level <= 3; level++) {
      assert.equal(weapon.level, level);
      if (key === 'ORBIT') {
        game.player.passives.cooldown = { count: 3 };
        assert.equal(weapon.getOrbitShardCount(game.player), level * 2);
        delete game.player.passives.cooldown;
        weapon.update(0.01, game.player, game); assert.equal(weapon._shards.length, level * 2);
      } else if (key === 'MINE') {
        game.mines = []; weapon.fire(game.player, game); assert.equal(game.mines.length, level);
      } else if (key === 'FROST_NOVA') {
        enemy.slowTimer = 0; weapon.fire(game.player, game);
        assert.equal(weapon.getRange(game.player), [200, 240, 280][level - 1]);
        assert.equal(enemy.slowTimer, [1.2, 1.8, 2.4][level - 1]);
      } else {
        game.projectiles = []; weapon.fire(game.player, game); assert.equal(game.projectiles.length, level);
      }
      weapon.levelUp();
    }
    assert.equal(weapon.level, 3);
  }
});

test('maxed upgrades leave the choice pool while instant healing stays available', async () => {
  const [{ BulletGame }, , , { WEAPONS, PASSIVES }] = await ready;
  const game = new BulletGame(canopy); game.start();
  game.player.weapons = ['KNIFE', 'MAGIC_WAND', 'ORBIT', 'MINE', 'FROST_NOVA'].map(key => {
    const weapon = game.makeWeapon(WEAPONS[key]); weapon.levelUp(); weapon.levelUp(); return weapon;
  });
  for (const key of ['MIGHT', 'COOLDOWN', 'MOVESPEED', 'MAX_HP', 'MAGNET']) {
    for (let i = 0; i < 3; i++) game.player.addPassive(PASSIVES[key]);
  }
  const { SHOT_WEAPONS } = await load('shot-patterns.js');
  const extra = game.makeWeapon(SHOT_WEAPONS[0]); extra.levelUp(); extra.levelUp(); game.player.weapons.push(extra);
  game.offerUpgrades(); assert.equal(game.choices.length, 1); assert.equal(game.choices[0].id, 'heal');
  assert.equal(game.choices[0].maxLevel, 0); game.player.hp = 10; game.pendingLevels = 1;
  game.choose('heal'); assert.equal(game.player.hp, 50); assert.equal(game.state, 'playing');
});

test('difficulty starts between previous balances and scales throughout endless survival', async () => {
  const [{ difficultyAt, scoreForRun, BulletGame }] = await ready;
  const initial = difficultyAt(0), middle = difficultyAt(300), late = difficultyAt(1800);
  assert.ok(initial.hp > 0.75 && initial.hp < 1);
  assert.ok(initial.spawnInterval > 0.8 && initial.spawnInterval < 1.5);
  assert.ok(late.hp > middle.hp && middle.hp > initial.hp);
  assert.ok(late.spawnInterval < middle.spawnInterval); assert.ok(late.batch > middle.batch);
  assert.ok(scoreForRun(0, 600) > scoreForRun(0, 300));
  const game = new BulletGame(canopy); game.start(); game.time = 5000; game.player.dead = true; game.update(1 / 60);
  assert.equal(game.state, 'over');
});

test('special charge progresses, freezes during pause and resets with ammunition', async () => {
  const [{ BulletGame }] = await ready;
  const game = new BulletGame(canopy); game.start(); assert.equal(game.snapshot().specialCharge, 1);
  game.special(); assert.equal(game.snapshot().specialCharge, 0);
  const origin = { ...game.specialOrigin }; game.player.x += 100;
  assert.deepEqual(game.specialOrigin, origin, 'shockwave stays at the cast location');
  game.time = 6; assert.equal(game.snapshot().specialCharge, 0.5);
  game.pause(); game.update(1); assert.equal(game.snapshot().specialCharge, 0.5);
  game.applyPickup('ammo'); assert.equal(game.snapshot().specialCharge, 1);
});

test('shockwave has layered rings, respects its actual radius and supports reduced motion', async () => {
  const { drawShockwave } = await load('special-effect.js');
  const arcs = [], lines = [];
  const ctx = new Proxy({}, { get: (_, key) => key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : key === 'arc' ? (...args) => arcs.push(args) : key === 'lineTo' ? (...args) => lines.push(args) : () => {}, set: () => true });
  drawShockwave(ctx, { x: 20, y: 30 }, 0.5);
  assert.equal(arcs.length, 4); assert.equal(lines.length, 24);
  assert.ok(arcs.every(args => args[2] <= 240));
  arcs.length = 0; lines.length = 0; drawShockwave(ctx, { x: 20, y: 30 }, 0.5, true);
  assert.equal(lines.length, 0); assert.equal(arcs[0][2], 240);
  arcs.length = 0; drawShockwave(ctx, { x: 20, y: 30 }, 2); assert.equal(arcs.length, 0);
});


test('infinite waves alternate formations, respite and rotating bosses', async () => {
  const [{ BulletGame }] = await ready;
  const { waveAt, formationSide, BOSS_ROSTER, FOES } = await load('waves.js');
  assert.equal(new Set(Object.values(FOES).map(e => e.hp)).size, 8);
  assert.equal(waveAt(32).breather, true);
  assert.equal(waveAt(40).breather, false);
  assert.equal(waveAt(40).formation, 'pincer');
  assert.equal(waveAt(240).formation, 'dive');
  assert.equal(waveAt(40000).number, 1001);
  assert.notEqual(formationSide('pincer', 0, 0), formationSide('pincer', 1, 0));
  assert.equal(new Set([0, 1, 2, 3].map(i => formationSide('ring', i, 0))).size, 4);
  const game = new BulletGame(canopy, rng()); game.start();
  game.enemies = []; game.time = 32; game.updateWaves(1); assert.equal(game.enemies.length, 0);
  for (let i = 0; i < 9; i++) {
    game.enemies = []; game.time = 120 + i * 160; game.updateWaves(0);
    const bosses = game.enemies.filter(e => e.boss);
    const expected = i < 3 ? 1 : i < 6 ? 2 : 3;
    assert.equal(bosses.length, expected);
    assert.equal(new Set(bosses.map(e => e.id)).size, expected);
    for (const boss of bosses) {
      const base = BOSS_ROSTER.find(def => def.id === boss.id);
      assert.equal(boss.maxHp, base.hp); assert.equal(boss.damage, base.damage); assert.equal(boss.speed, base.speed);
    }
    assert.equal(game.snapshot().bosses.length, expected);
    game.updateWaves(0); assert.equal(game.enemies.filter(e => e.boss).length, expected);
    game.time += 160; game.updateWaves(0);
    assert.equal(game.enemies.filter(e => e.boss).length, expected, 'an unfinished group prevents piling up more bosses');
  }
});

test('three bosses warn before distinct projectile patterns and cancel pending attacks on death', async () => {
  const [{ BulletGame }, { enemySprite, enemyHasShadow, ASSETS }, { Enemy }] = await ready;
  const { BOSS_ROSTER, FOES } = await load('waves.js');
  const { updateBoss, updateBossAttacks } = await load('bosses.js');
  for (const def of [...Object.values(FOES), ...BOSS_ROSTER]) {
    assert.ok(ASSETS[enemySprite(def)]);
    assert.equal(enemyHasShadow(def), def.sprite.startsWith('fast'));
  }
  for (const [index, def] of BOSS_ROSTER.entries()) {
    const game = new BulletGame(canopy, rng()); game.start();
    const boss = new Enemy(game.player.x + 300, game.player.y, def, 1, 1);
    game.enemies = [boss]; boss.attackTimer = 0;
    updateBoss(boss, game, 0.01);
    assert.ok(boss.telegraph); assert.equal(game.bossShots.length, 0);
    if (index === 2) assert.equal(game.hazards.length, 3);
    game.time = 0.9; updateBoss(boss, game, 0.01);
    assert.equal(game.bossShots.length, [21, 28, 5][index]);
    updateBossAttacks(game, 0.01); assert.ok(game.enemyProjectiles.length > 0);
    if (index === 2) assert.ok(game.enemyProjectiles.every(p => p.seekRemaining > 0));
    game.pause(); const before = JSON.stringify([game.bossShots, game.hazards]);
    game.update(5); assert.equal(JSON.stringify([game.bossShots, game.hazards]), before);
    boss.hp = 0; updateBossAttacks(game, 0.01);
    assert.equal(game.bossShots.length, 0); assert.equal(game.hazards.length, 0);
  }
});


test('new firing patterns scale counts, spread directions, explode and return', async () => {
  const [{ BulletGame }, , { Enemy }, { ENEMIES }] = await ready;
  const { SHOT_WEAPONS } = await load('shot-patterns.js');
  const game = new BulletGame(canopy, rng()); game.start();
  const enemy = new Enemy(game.player.x + 100, game.player.y, ENEMIES.ZOMBIE, 100, 1);
  game.enemies = [enemy]; game.spatial.insertAll(game.enemies);
  for (const def of SHOT_WEAPONS) {
    const w = game.makeWeapon(def);
    for (let level = 1; level <= 3; level++) {
      game.projectiles = []; w.fire(game.player, game);
      assert.equal(game.projectiles.length, def.counts[level - 1]);
      assert.equal(new Set(game.projectiles.map(p => p.angle)).size, def.counts[level - 1]);
      if (def.id === 'hedgehog') assert.ok(game.projectiles.some(p => p.vx < 0));
      if (def.id === 'carrot_bomb') {
        const p = game.projectiles[0]; p.x = enemy.x; const hp = enemy.hp;
        p._onEnd(game); assert.ok(enemy.hp < hp);
        assert.equal(p.explodeRadius, [65, 90, 115][level - 1]);
      }
      if (def.id === 'return_blade') {
        const p = game.projectiles[0]; p.hitEnemies.add(enemy);
        for (let i = 0; i < 60; i++) p.update(1 / 60, game);
        assert.equal(p.returning, true); assert.equal(p.hitEnemies.size, 0);
        assert.ok(p.vx < 0);
        for (let i = 0; i < 180 && !p.shouldRemove; i++) p.update(1 / 60, game);
        assert.equal(p.shouldRemove, true);
      }
      w.levelUp();
    }
    assert.equal(w.level, 3);
  }
});

test('first upgrade offers a new firing pattern and choosing equips it', async () => {
  const [{ BulletGame }] = await ready;
  const { SHOT_WEAPONS } = await load('shot-patterns.js');
  for (let seed = 1; seed <= 20; seed++) {
    const game = new BulletGame(canopy, rng(seed)); game.start(); game.player.level = 2;
    game.offerUpgrades();
    const choice = game.choices.find(c => SHOT_WEAPONS.some(w => w.id === c.id));
    assert.ok(choice); game.choose(choice.id);
    assert.ok(game.player.weapons.some(w => w.id === choice.id && w.level === 1));
    assert.equal(game.state, 'playing');
  }
});

test('each boss death creates eight safe seconds, including during multi-boss encounters', async () => {
  const [{ BulletGame, BOSS_RECOVERY_SECONDS }] = await ready;
  const { BOSS_ROSTER, FOES } = await load('waves.js');
  const game = new BulletGame(canopy, rng()); game.start(); game.enemies = [];
  game.player.weapons = [];
  const first = game.spawn(BOSS_ROSTER[0]);
  const second = game.spawn(BOSS_ROSTER[1]);
  game.spawn(FOES.minion);
  game.enemyProjectiles = [{}]; game.bossShots = [{}]; game.hazards = [{}];
  first.hp = 0; game.collectDeaths();
  assert.equal(game.bossKills, 1); assert.equal(game.kills, 1);
  assert.deepEqual(game.enemies, [second]);
  assert.equal(game.enemyProjectiles.length + game.bossShots.length + game.hazards.length, 0);
  assert.equal(game.snapshot().wave.secondsLeft, BOSS_RECOVERY_SECONDS);
  assert.equal(game.snapshot().wave.breather, true);
  assert.equal(game.spawn(FOES.minion), null);
  assert.equal(game.special(), false);
  const position = [second.x, second.y, second.hp];
  const waveClock = game.time - game.waveDelay;
  game.input.getMoveVector = () => ({ x: 1, y: 0 });
  const playerX = game.player.x;
  for (let i = 0; i < 420; i++) game.update(1 / 60);
  assert.deepEqual([second.x, second.y, second.hp], position);
  assert.ok(game.player.x > playerX);
  assert.ok(Math.abs(game.time - game.waveDelay - waveClock) < 0.001);
  assert.equal(game.recovering, true);
  for (let i = 0; i < 70; i++) game.update(1 / 60);
  assert.equal(game.recovering, false);
  second.hp = 0; game.collectDeaths();
  assert.equal(game.bossKills, 2); assert.equal(game.recovering, true);
  assert.equal(game.enemies.length, 0);
  game.pause(); const until = game.recoveryUntil, time = game.time;
  game.update(10); assert.equal(game.time, time); assert.equal(game.recoveryUntil, until);
});

test('third boss and summoned reinforcements share a bounded population budget', async () => {
  const [{ BulletGame, populationLimit }] = await ready;
  const { FOES } = await load('waves.js');
  const { updateBoss } = await load('bosses.js');
  const game = new BulletGame(canopy, rng()); game.start(); game.enemies = [];
  game.time = 440; game.nextBossIndex = 2;
  for (let i = 0; i < 200; i++) game.spawn(FOES.minion);
  assert.equal(game.enemies.length, populationLimit(440));
  game.updateWaves(0);
  const queen = game.enemies.find(e => e.boss);
  assert.equal(queen.id, 'brood_queen');
  assert.equal(game.enemies.filter(e => !e.boss).length, populationLimit(440, true));
  for (let i = 0; i < 100; i++) {
    game.spawn(FOES.minion2);
    queen.attackCount = 0; queen.telegraph = { angle: 0, until: game.time };
    updateBoss(queen, game, 0.01);
    game.updateWaves(8);
    assert.ok(game.enemies.length <= populationLimit(game.time, true) + 1);
  }
  assert.ok(populationLimit(100000) <= 48);
  assert.ok(populationLimit(100000, true) <= 18);
});

test('orbit upgrades keep moving during boss recovery without damaging surviving bosses', async () => {
  const [{ BulletGame }, , , { WEAPONS }] = await ready;
  const { BOSS_ROSTER } = await load('waves.js');
  const game = new BulletGame(canopy, rng()); game.start(); game.enemies = [];
  const orbitDef = Object.values(WEAPONS).find(def => def.type === 'orbit');
  const orbit = game.makeWeapon(orbitDef);
  game.player.weapons = [orbit];
  const boss = game.spawn(BOSS_ROSTER[0]);
  game.recoveryUntil = game.time + 8;
  game.update(1 / 60);
  const shard = orbit._shards[0];
  const angle = shard.angle;
  boss.x = shard.x; boss.y = shard.y;
  const hp = boss.hp;
  game.input.getMoveVector = () => ({ x: 1, y: 0 });
  for (let i = 0; i < 60; i++) game.update(1 / 60);
  assert.ok(shard.angle > angle);
  assert.ok(Math.abs(Math.hypot(shard.x - game.player.x, shard.y - game.player.y) - shard.radius) < 0.001);
  assert.equal(boss.hp, hp);
  game.pause(); const pausedAngle = shard.angle;
  game.update(1); assert.equal(shard.angle, pausedAngle);
});
