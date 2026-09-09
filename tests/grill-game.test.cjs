/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../lib/grill-game.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exported = {};
new Function('exports', compiled)(exported);
const { grillReducer: reduce, initialGrillGame, getDifficulty, cookingTimes, getFoodImagePath } = exported;
const start = () => reduce(initialGrillGame, { type: 'START', random: 0 });
const tick = (game, milliseconds) => reduce(game, { type: 'TICK', milliseconds, random: 0 });
const place = game => reduce(game, { type: 'PLACE', food: 'salsiccia' });

test('six spaces, first order immediately and raw food cannot be served', () => {
  let game = start();
  assert.equal(game.orders.length, 1);
  for (let i = 0; i < 6; i++) game = place(game);
  assert.equal(game.slots.filter(Boolean).length, 6);
  assert.equal(place(game), game);
  assert.equal(reduce(game, { type: 'SERVE', index: 0 }), game);
});
test('automatic raw/cooked/burnt transition; burning only costs a life when removed', () => {
  let game = place(start());
  game = tick(game, cookingTimes(0).ready - 1);
  assert.equal(game.slots[0].state, 'crudo');
  game = tick(game, 1);
  assert.equal(game.slots[0].state, 'cotto');
  game = tick(game, cookingTimes(0).burnt - cookingTimes(0).ready);
  assert.equal(game.slots[0].state, 'bruciato');
  assert.equal(game.lives, 3);
  const discarded = reduce(game, { type: 'DISCARD', index: 0 });
  assert.equal(discarded.lives, 2);
  assert.equal(discarded.slots[0], null);
  assert.equal(reduce(discarded, { type: 'DISCARD', index: 0 }), discarded);
});
test('serves first compatible order exactly once and keeps a simple consecutive combo', () => {
  let game = tick(place(place(start())), cookingTimes(0).ready);
  const first = game.orders[0].id, second = game.orders[1].id;
  game = reduce(game, { type: 'SERVE', index: 0 });
  assert.ok(!game.orders.some(o => o.id === first));
  assert.equal(game.orders[0].id, second);
  assert.equal(game.score, 35); assert.equal(game.combo, 1);
  assert.equal(reduce(game, { type: 'SERVE', index: 0 }), game);
  game = reduce(game, { type: 'SERVE', index: 1 });
  assert.equal(game.score, 77); assert.equal(game.combo, 2); assert.equal(game.served, 2);
});
test('unrequested cooked food stays on the grill without score or life changes', () => {
  const game = { ...tick(place(start()), 6000), orders: [] };
  assert.equal(reduce(game, { type: 'SERVE', index: 0 }), game);
});
test('order expiry costs a life, resets combo and never takes lives below zero', () => {
  let game = { ...start(), combo: 3 };
  game = tick(game, 20000);
  assert.equal(game.lives, 2); assert.equal(game.combo, 0);
  game = { ...game, lives: 1, orders: Array.from({ length: 3 }, (_, id) => ({ id, foodType: 'salsiccia', timeLeft: 1, maxTime: 20000 })) };
  game = tick(game, 1);
  assert.equal(game.lives, 0); assert.equal(game.phase, 'GAMEOVER');
  assert.equal(tick(game, 1000), game);
});
test('time boundaries unlock foods and increase order capacity', () => {
  for (const [elapsed, count, cap] of [[0,2,2],[44999,2,2],[45000,3,3],[89999,3,3],[90000,5,3],[149999,5,3],[150000,6,4],[239999,6,4],[240000,6,5],[359999,6,5],[360000,6,6]]) {
    assert.equal(getDifficulty(elapsed).allowedFoods.length, count);
    assert.equal(getDifficulty(elapsed).maxOrders, cap);
  }
  for (const elapsed of [0,45000,90000,150000,240000,360000,480000]) {
    let game = { ...start(), elapsed };
    for (let i = 0; i < 7; i++) {
      game = { ...game, orders: game.orders.map(o => ({ ...o, timeLeft: 100000 })) };
      game = tick(game, getDifficulty(game.elapsed).orderInterval);
      assert.ok(game.orders.length <= getDifficulty(game.elapsed).maxOrders);
    }
    assert.equal(game.orders.length, getDifficulty(elapsed).maxOrders);
  }
});
test('same run survives beyond eight minutes and serves both late foods with valid cooked/burnt assets', () => {
  let game = start();
  const run = game.run;
  const seen = new Set();
  const states = new Set();
  for (let i = 0; i < 6000; i++) {
    // Always request the newest food so each unlock is exercised immediately.
    game = reduce(game, { type: 'TICK', milliseconds: 100, random: 0.999 });
    assert.equal(game.phase, 'PLAYING');
    assert.equal(game.run, run);
    for (let index = 0; index < game.slots.length; index++) {
      const slot = game.slots[index];
      if (slot?.state === 'cotto') {
        states.add(slot.foodType);
        game = reduce(game, { type: 'SERVE', index });
      }
    }
    for (const order of game.orders) {
      seen.add(order.foodType);
      if (game.slots.filter(slot => slot?.foodType === order.foodType).length < game.orders.filter(item => item.foodType === order.foodType).length)
        game = reduce(game, { type: 'PLACE', food: order.foodType });
    }
  }
  assert.equal(game.elapsed, 600000);
  assert.equal(game.lives, 3);
  for (const food of ['spiedino', 'bistecca']) {
    assert.ok(seen.has(food));
    assert.ok(states.has(food));
    const burning = tick({ ...reduce(game, { type: 'PLACE', food }), orders: [] }, cookingTimes(game.elapsed).burnt);
    assert.ok(burning.slots.some(slot => slot?.foodType === food && slot.state === 'bruciato'));
  }
  for (const food of getDifficulty(game.elapsed).allowedFoods) for (const state of ['crudo', 'cotto', 'bruciato']) {
    const file = getFoodImagePath(food, state).split('/').pop();
    assert.ok(fs.readdirSync(path.join(__dirname, '../public/grigliata')).includes(file), file);
  }
  assert.equal(reduce(start(), { type: 'PLACE', food: 'bistecca' }).slots.filter(Boolean).length, 0);
});
test('late difficulty increases gradually and stops at playable limits', () => {
  assert.ok(getDifficulty(300000).cookSpeed > getDifficulty(240000).cookSpeed);
  assert.ok(getDifficulty(300000).orderInterval < getDifficulty(240000).orderInterval);
  assert.deepEqual(getDifficulty(480000), getDifficulty(100000000));
  assert.equal(cookingTimes(480000).ready, 3000);
  assert.equal(cookingTimes(480000).burnt - cookingTimes(480000).ready, 3000);
  assert.equal(getDifficulty(480000).orderInterval, 2000);
});
test('only losing all lives ends a run; retry resets survival and score', () => {
  let game = tick({ ...start(), score: 99999, served: 3, orders: [] }, 45000);
  assert.equal(game.phase, 'PLAYING');
  assert.equal(game.score, 99999);
  game = { ...game, lives: 1, orders: [{ id: 99, foodType: 'salsiccia', timeLeft: 1, maxTime: 20000 }] };
  game = tick(game, 1);
  assert.equal(game.phase, 'GAMEOVER');
  const run = game.run;
  game = reduce(game, { type: 'START', random: 0 });
  assert.equal(game.elapsed, 0); assert.equal(game.score, 0); assert.equal(game.served, 0);
  assert.equal(game.lives, 3); assert.equal(game.run, run + 1);
});
