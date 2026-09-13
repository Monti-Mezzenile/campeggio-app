const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const rewards = import(pathToFileURL(path.resolve(__dirname, '../lib/game-rewards.js')).href);

test('all games cap mascot XP by active time, including extreme combos and cooperative kills', async () => {
  const { grillReward, runnerReward, mergeReward, bulletReward } = await rewards;
  for (const calculate of [grillReward, runnerReward, mergeReward, bulletReward]) {
    for (const seconds of [0, 1, 30, 60, 300, 3600]) {
      const xp = calculate(1000000, seconds);
      assert.equal(xp, Math.floor(seconds * 0.6));
      assert.equal(calculate(1000000, NaN), 0);
      assert.ok(calculate(-10, seconds) >= 0);
    }
  }
});
test('grill rewards service instead of idle time or an ever-growing score combo', async () => {
  const { grillReward } = await rewards;
  assert.equal(grillReward(0, 600), 0);
  assert.equal(grillReward(10, 60), 20);
  assert.equal(grillReward(20, 60), 36);
  assert.equal(grillReward(80, 300), 160);
  // Previously 20 uninterrupted servings earned 527 XP in one minute.
  const score = 20 * 35 + 7 * 20 * 19 / 2;
  assert.equal(Math.floor(score / 4) + 20, 527);
});
test('representative one-minute runs have comparable rewards without removing performance', async () => {
  const { grillReward, runnerReward, mergeReward, bulletReward } = await rewards;
  assert.deepEqual([grillReward(15, 60), runnerReward(3800, 60), mergeReward(750, 60), bulletReward(24, 60)], [30, 31, 30, 32]);
  assert.ok(mergeReward(250, 60) < mergeReward(750, 60));
  assert.ok(bulletReward(4, 60) < bulletReward(24, 60));
});
test('splitting an identical performance into short restarts never increases XP', async () => {
  const { grillReward, runnerReward, mergeReward, bulletReward } = await rewards;
  for (const calculate of [grillReward, runnerReward, mergeReward, bulletReward]) {
    assert.ok(calculate(20, 10) * 6 <= calculate(120, 60));
  }
});
