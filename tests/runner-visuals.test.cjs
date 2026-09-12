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
  assert.equal(getMascotRunSheet(11), null);
  for (let phase = 2; phase <= 10; phase++) {
    const png = fs.readFileSync(path.join(__dirname, '../public', getMascotRunSheet(phase)));
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 256);
  }
  assert.deepEqual([0, 179, 180, 360, 540, 720].map(time => getMascotRunFrame(time)), [0, 0, 1, 2, 3, 0]);
  assert.equal(getMascotRunFrame(540, true), 1);
});

test('hazard edges and near landings are forgiving while direct hits still collide', () => {
  const { runnerHorizontalContact, runnerContact } = exported;
  assert.equal(runnerHorizontalContact(80, 60, false), false);
  assert.equal(runnerHorizontalContact(0, 60, false), false);
  assert.equal(runnerHorizontalContact(40, 60, false), true);
  assert.equal(runnerContact(52, 34, 52, false, 60), false);
  assert.equal(runnerContact(52, 0, 52, false, 60), true);
  assert.equal(runnerHorizontalContact(80, 60, true), true);
});

test('new waves provide a bonus break and clear slalom corridors without overlapping rewards', () => {
  const { runnerWave } = exported;
  const breakWave = runnerWave(3, 130000);
  assert.equal(breakWave.hazards.length, 0);
  assert.equal(breakWave.pickups.length, 12);
  const slalom = runnerWave(4, 160000);
  for (const pickup of slalom.pickups) {
    const row = slalom.hazards.filter(item => item.offset === pickup.offset);
    assert.equal(row.length, 2);
    assert.ok(row.every(item => item.lane !== pickup.lane));
  }
  for (let index = 0; index < 32; index++) {
    const wave = runnerWave(index, 40000 + index * 30000);
    for (const item of [...wave.hazards, ...(wave.pickups ?? [])]) {
      assert.ok(item.lane >= 0 && item.lane <= 2);
      assert.ok(item.offset >= 0 && item.offset <= (index < 8 ? 1100 : 4500));
    }
  }
});

test('after the introduction formations vary, stay silent and build pressure', () => {
  const { runnerWave, runnerWaveInterval } = exported;
  let seed = 42;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const signatures = new Set();
  const pigRoutes = new Set();
  let earlyCount = 0;
  let lateCount = 0;
  let mixedWaves = 0;
  let veryLateCount = 0;
  for (let sample = 0; sample < 300; sample++) {
    const wave = runnerWave(8, 280000, random);
    signatures.add(JSON.stringify(wave.hazards));
    assert.equal(wave.label, '');
    earlyCount += wave.hazards.length;
    lateCount += runnerWave(40, 700000, random).hazards.length;
    veryLateCount += runnerWave(200, 2500000, random).hazards.length;
    if (new Set(wave.hazards.map(hazard => hazard.hazard)).size >= 3) mixedWaves++;
    const offsets = [...new Set(wave.hazards.map(hazard => hazard.offset))];
    for (const offset of offsets) {
      const row = wave.hazards.filter(hazard => hazard.offset === offset);
      assert.ok(new Set(row.map(hazard => hazard.targetLane)).size < 3 ||
        (row.length === 3 && row.every(hazard => hazard.hazard === 1)),
      'every row leaves an opening or a jumpable customs gate');
    }
    for (const hazard of wave.hazards) {
      assert.ok([0, 1, 2].includes(hazard.lane));
      assert.ok([0, 1, 2].includes(hazard.targetLane));
      if (hazard.hazard === 4) pigRoutes.add(`${hazard.lane}>${hazard.targetLane}`);
    }
    for (const pickup of wave.pickups) {
      assert.ok(!wave.hazards.some(hazard => hazard.offset === pickup.offset && hazard.targetLane === pickup.lane));
    }
  }
  assert.ok(signatures.size > 100);
  assert.equal(pigRoutes.size, 9, 'pigs use every direction, including straight runs and inward turns');
  assert.ok(lateCount > earlyCount * 1.4);
  assert.ok(veryLateCount > lateCount, 'complexity keeps increasing beyond the previous final tier');
  assert.ok(mixedWaves > 200, 'obstacle types mix within waves, rather than repeating one theme');
  assert.equal(runnerWaveInterval(7), 30000);
  assert.ok(runnerWaveInterval(8) < 30000);
  assert.ok(runnerWaveInterval(30) < runnerWaveInterval(8));
  assert.equal(runnerWaveInterval(1000), 8500);
});

test('consecutive customs gates allow landing before the next jump at maximum speed', () => {
  const { runnerWave, getRunnerPace } = exported;
  const wave = runnerWave(40, 700000, () => 0.2);
  const rows = [...new Set(wave.hazards.map(hazard => hazard.offset))];
  assert.ok(rows.length >= 7);
  // Match the game's single-jump physics, with a generous landing/reaction margin.
  const jumpFrames = Math.ceil(2 * 12 / 0.65) + 10;
  for (let i = 0; i < rows.length; i++) {
    assert.equal(wave.hazards.filter(hazard => hazard.offset === rows[i]).length, 3);
    if (i) assert.ok((rows[i] - rows[i - 1]) / getRunnerPace(700000).speed > jumpFrames);
  }
});
