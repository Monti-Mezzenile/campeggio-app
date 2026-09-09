/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../lib/merge-game.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {}; new Function('exports', code)(api);
const { createMergeGame, stepMerge, addBody, dropItem, activateMagnet, rainSchedule, itemRadius, itemIcon, MERGE_ITEMS, BOMB, ROCK, ICE, STEP } = api;
const random = () => 0.5;
const advance = (g, ms) => { for (let i = 0; i < Math.ceil(ms / STEP); i++) stepMerge(g, random); };
const body = (g, type, x, y) => { addBody(g, type, x); const b = g.bodies.at(-1); b.y = y; b.vy = 0; return b; };

test('every game asset exists, including new hazards', () => {
  for (const type of [BOMB, ROCK, ICE, ...MERGE_ITEMS.map((_, i) => i)]) {
    const file = path.join(__dirname, '../public', itemIcon(type));
    assert.ok(fs.readdirSync(path.dirname(file)).includes(path.basename(file)), file);
  }
});
test('drop clamps to the bowl and rejects rapid duplicate taps', () => {
  const g = createMergeGame(random);
  assert.equal(dropItem(g, -100, random), true);
  assert.equal(g.bodies[0].x, itemRadius(g.bodies[0].type) + 8);
  assert.equal(dropItem(g, 200, random), false);
  advance(g, 500);
  assert.equal(dropItem(g, 900, random), true);
  assert.equal(g.bodies.at(-1).x, 360 - itemRadius(g.bodies.at(-1).type) - 8);
});
test('equal objects merge exactly once and award points', () => {
  const g = createMergeGame(random);
  body(g, 0, 170, 300); body(g, 0, 190, 300);
  stepMerge(g, random);
  assert.equal(g.bodies.length, 1); assert.equal(g.bodies[0].type, 1);
  assert.equal(g.score, 25); assert.equal(g.merges, 1);
  stepMerge(g, random); assert.equal(g.score, 25);
});
test('bomb clears rocks and ice freezes a food without merging it', () => {
  const g = createMergeGame(random);
  body(g, BOMB, 160, 300); body(g, ROCK, 175, 300); body(g, 0, 220, 300);
  stepMerge(g, random); assert.equal(g.bodies.length, 0);
  body(g, ICE, 160, 300); body(g, 0, 175, 300);
  stepMerge(g, random); assert.equal(g.bodies.length, 1); assert.ok(g.bodies[0].frozenUntil > g.elapsed);
  body(g, 0, 180, 300); stepMerge(g, random); assert.equal(g.merges, 0);
});
test('frenzy doubles points; magnet cooldown and restart have no leftover timers', () => {
  const g = createMergeGame(random);
  g.fever = 90;
  body(g, 0, 160, 300); body(g, 0, 180, 300); stepMerge(g, random);
  assert.ok(g.feverUntil > g.elapsed);
  g.bodies = []; body(g, 0, 160, 300); body(g, 0, 180, 300); stepMerge(g, random);
  assert.equal(g.score, 75);
  assert.equal(activateMagnet(g), true); assert.equal(activateMagnet(g), false);
  advance(g, 8100); assert.equal(g.feverUntil, 0); assert.equal(g.fever, 0);
  const retry = createMergeGame(random);
  assert.equal(retry.magnetReadyAt, 0); assert.equal(retry.elapsed, 0); assert.equal(retry.bodies.length, 0);
});
test('rain gives four seconds warning, pauses between waves and caps its intensity', () => {
  assert.equal(rainSchedule(40999).warning, false);
  assert.equal(rainSchedule(41000).warning, true);
  assert.equal(rainSchedule(45000).active, true);
  assert.equal(rainSchedule(53000).active, false);
  assert.equal(rainSchedule(81000).warning, true);
  assert.equal(rainSchedule(85000).active, true);
  assert.equal(rainSchedule(45000 + 40 * 40000).interval, 850);
  assert.equal(rainSchedule(45000 + 40 * 40000).duration, 12000);
});
test('automatic pieces arrive without input, with preview, while manual drops still work', () => {
  const g = createMergeGame(random);
  advance(g, 45150);
  assert.ok(g.incoming); assert.equal(g.bodies.length, 0);
  const predicted = { ...g.incoming };
  advance(g, 850);
  assert.ok(g.bodies.some(b => b.type === predicted.type && Math.abs(b.x - predicted.x) < 1));
  assert.equal(dropItem(g, 50, random), true);
  advance(g, 7500);
  assert.ok(g.bodies.length > 1); assert.equal(g.incoming, null);
});
test('overlapping rocks separate and physics stays finite', () => {
  const g = createMergeGame(random);
  body(g, ROCK, 180, 400); body(g, ROCK, 180, 400);
  advance(g, 2000);
  assert.ok(Math.abs(g.bodies[0].x - g.bodies[1].x) > 40);
  assert.ok(g.bodies.every(b => [b.x, b.y, b.vx, b.vy].every(Number.isFinite)));
});
test('a blocked pile ends the game and further ticks or actions cannot change it', () => {
  const g = createMergeGame(random);
  for (let row = 0; row < 9; row++) for (let col = 0; col < 6; col++) body(g, ROCK, 34 + col * 50, 424 - row * 48);
  advance(g, 15000);
  assert.equal(g.phase, 'GAMEOVER');
  const snapshot = JSON.stringify(g);
  advance(g, 2000); assert.equal(dropItem(g, 180), false); assert.equal(activateMagnet(g), false);
  assert.equal(JSON.stringify(g), snapshot);
});
