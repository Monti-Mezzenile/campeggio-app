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
  for (const [time, label, darkness] of [[0,'Giorno',0],[40000,'Tramonto',0],[42500,'Tramonto',0.5],[45000,'Notte',1],[85000,'Alba',1],[87500,'Alba',0.5],[90000,'Giorno',0]]) {
    assert.deepEqual(getRunnerLighting(time), { label, darkness });
  }
  for (let time = 0; time < 180000; time += 100) {
    const { darkness } = getRunnerLighting(time);
    assert.ok(darkness >= 0 && darkness <= 1);
    assert.ok(Math.abs(darkness - getRunnerLighting(time + 100).darkness) <= 0.021);
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

test('three lanes clamp at their edges; jumping avoids hazards but misses ground bonuses', () => {
  const { clampLane, laneFloor, runnerContact } = exported;
  assert.equal(clampLane(-1), 0);
  assert.equal(clampLane(3), 2);
  assert.ok(laneFloor(0) > laneFloor(1));
  for (let lane = 0; lane < 3; lane++) {
    const floor = laneFloor(lane);
    assert.equal(runnerContact(floor, 0, floor, true, 40), true);
    assert.equal(runnerContact(floor, 25, floor, true, 40), false);
    assert.equal(runnerContact(floor, 0, floor, false, 52), true);
    assert.equal(runnerContact(floor, 60, floor, false, 52), false);
    assert.equal(runnerContact(floor, 0, laneFloor((lane + 1) % 3), false, 52), false);
  }
});

test('waves introduce changing-lane pigs and staggered rocks before full-lane barriers', () => {
  const { runnerWave } = exported;
  const pigs = runnerWave(0, 40000).hazards;
  assert.equal(pigs.length, 2);
  assert.ok(pigs.every(pig => pig.hazard === 4 && pig.targetLane !== pig.lane));
  const rocks = runnerWave(1, 70000).hazards;
  assert.equal(rocks.length, 3);
  assert.ok(rocks.every(rock => rock.hazard === 3));
  assert.equal(new Set(rocks.map(rock => rock.offset)).size, 3);
  assert.equal(runnerWave(2, 100000).hazards.length, 2);
  const wall = runnerWave(5, 190000).hazards;
  assert.deepEqual(wall.map(item => item.lane), [0, 1, 2]);
  assert.ok(wall.every(item => item.offset === 0 && !HAZARDS[item.hazard].speedMultiplier));
});

test('day/night roads match dimensions and both background videos are present', () => {
  const dimensions = ['base_giorno.png', 'base_notte.png'].map(name => {
    const png = fs.readFileSync(path.join(__dirname, '../public/runner', name));
    return [png.readUInt32BE(16), png.readUInt32BE(20)];
  });
  assert.deepEqual(dimensions[0], dimensions[1]);
  for (const name of ['runner-bg.mp4', 'runner-bg-night.mp4']) assert.ok(fs.statSync(path.join(__dirname, '../public', name)).size > 0);
});

test('all evolved mascot run sheets contain four square frames with a gentle cycle', () => {
  const { getMascotRunSheet, getMascotRunFrame } = exported;
  assert.equal(getMascotRunSheet(1), null);
  assert.equal(getMascotRunSheet(10), null);
  for (let phase = 2; phase <= 9; phase++) {
    const png = fs.readFileSync(path.join(__dirname, '../public', getMascotRunSheet(phase)));
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 256);
  }
  assert.deepEqual([0, 179, 180, 360, 540, 720].map(time => getMascotRunFrame(time)), [0, 0, 1, 2, 3, 0]);
  assert.equal(getMascotRunFrame(540, true), 1);
});
