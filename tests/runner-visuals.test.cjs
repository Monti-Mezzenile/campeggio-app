/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../lib/runner-visuals.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {};
new Function('exports', compiled)(exported);
const { HAZARDS, COLLECTIBLES, getRunnerLighting, getSpriteFrame } = exported;

test('every obstacle and collectible has a real PNG with exact filename case', () => {
  for (const item of [...HAZARDS, ...COLLECTIBLES]) {
    const file = path.join(__dirname, '../public', item.icon);
    assert.ok(fs.readdirSync(path.dirname(file)).includes(path.basename(file)), item.icon);
    const png = fs.readFileSync(file);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.ok(png.readUInt32BE(16) > 0);
  }
});
test('pig and rolling rock have four square frames; guide starts at first frame', () => {
  const sprites = HAZARDS.filter(item => item.isSprite);
  assert.deepEqual(sprites.map(item => item.id), ['sasso_rotolante', 'maialino']);
  for (const sprite of sprites) {
    const png = fs.readFileSync(path.join(__dirname, '../public', sprite.icon));
    assert.equal(png.readUInt32BE(16), png.readUInt32BE(20) * 4);
  }
  assert.deepEqual([0, 100, 200, 300, 400].map(getSpriteFrame), [0, 1, 2, 3, 0]);
});
test('background cycles smoothly through day, dusk, night and dawn', () => {
  for (const [time, label, darkness] of [[0,'Giorno',0],[30000,'Tramonto',0],[35000,'Tramonto',0.5],[40000,'Notte',1],[70000,'Alba',1],[75000,'Alba',0.5],[80000,'Giorno',0]]) {
    assert.deepEqual(getRunnerLighting(time), { label, darkness });
  }
  for (let time = 0; time < 160000; time += 100) {
    const { darkness } = getRunnerLighting(time);
    assert.ok(darkness >= 0 && darkness <= 1);
    assert.ok(Math.abs(darkness - getRunnerLighting(time + 100).darkness) <= 0.011);
  }
});

test('pace stays gentle for 30 seconds and increases over five minutes with a cap', () => {
  const { getRunnerPace } = exported;
  assert.deepEqual(getRunnerPace(0), getRunnerPace(30000));
  assert.equal(getRunnerPace(0).speed, 3.6);
  assert.ok(getRunnerPace(60000).speed < 4);
  assert.ok(getRunnerPace(180000).speed < getRunnerPace(330000).speed);
  assert.deepEqual(getRunnerPace(330000), getRunnerPace(3600000));
  assert.ok(getRunnerPace(3600000, true).speed < 6.3);
  assert.equal(getRunnerPace(0).spawnDelay, 2100);
  assert.equal(getRunnerPace(3600000).spawnDelay, 1700);
});
