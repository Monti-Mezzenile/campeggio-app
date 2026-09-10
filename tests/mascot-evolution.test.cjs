/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const exported = {};
new Function('exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/mascot-evolution.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exported);
const { getMascotPose, getStageFromExp, POSE_INTERVAL, EVOLUTION_STAGES } = exported;
test('phase ten unlocks at 150000 XP and preserves prior phase thresholds', () => {
  assert.equal(getStageFromExp(799), 1);
  assert.equal(getStageFromExp(800), 2);
  assert.equal(getStageFromExp(100000), 9);
  assert.equal(getStageFromExp(149999), 9);
  assert.equal(getStageFromExp(150000), 10);
  assert.equal(getStageFromExp(9999999), 10);
  assert.equal(EVOLUTION_STAGES[10].name, 'Divinità Runica dell’Oblio');
});
test('poses change every half hour and wrap after two hours; phase one is static', () => {
  for (let phase = 2; phase <= 10; phase++) {
    assert.equal(getMascotPose(phase, POSE_INTERVAL - 1), `/posemascotte/fase${phase}_A.png`);
    for (let slot = 0; slot < 4; slot++) {
      const image = getMascotPose(phase, slot * POSE_INTERVAL);
      assert.equal(image, `/posemascotte/fase${phase}_${'ABCD'[slot]}.png`);
      assert.ok(fs.existsSync(path.join(__dirname, '../public', image)));
    }
    assert.equal(getMascotPose(phase, POSE_INTERVAL * 4), getMascotPose(phase, 0));
  }
  assert.equal(getMascotPose(1, 0), getMascotPose(1, POSE_INTERVAL));
});

test('personal pose offsets stay consistent across viewers and rotate without synchronizing everyone', () => {
  const ids = ['cavia-1', 'cavia-2', 'cavia-3', 'cavia-4'];
  assert.equal(new Set(ids.map(id => getMascotPose(2, 0, id))).size, 4);
  for (const id of ids) {
    const poses = [0, 1, 2, 3].map(slot => getMascotPose(2, slot * POSE_INTERVAL, id));
    assert.equal(new Set(poses).size, 4);
    assert.equal(getMascotPose(2, POSE_INTERVAL * 4, id), poses[0]);
    assert.equal(getMascotPose(1, 0, id), getMascotPose(1, POSE_INTERVAL, id));
  }
});
