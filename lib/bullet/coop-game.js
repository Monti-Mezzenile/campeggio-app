import { BulletGame } from './game.js';
import { Player } from './core/entities.js';
import { WORLD, shootingPose } from './assets.js';

const fields = ['attackAt', 'specialAt', 'specialReadyAt', 'specialOrigin', 'shieldUntil', 'speedUntil', 'shootingPose'];
const still = { getMoveVector: () => ({ x: 0, y: 0 }), clear() {} };
export class CoopGame extends BulletGame {
  reset() {
    super.reset();
    const guest = new Player(this.player.x + 85, this.player.y);
    guest.weapons = [this.makeWeapon(this.player.weapons[0].def)];
    this.players = [this.player, guest];
    this.progressPlayer = this.player;
    this.contexts = this.players.map(player => ({ player, input: still, ...Object.fromEntries(fields.map(key => [key, this[key]])) }));
    this.reviveTime = 0; this.choiceVersion = 0;
  }
  enter(index) {
    const previous = { player: this.player, input: this.input, ...Object.fromEntries(fields.map(key => [key, this[key]])) };
    const context = this.contexts[index];
    Object.assign(this, context);
    return () => {
      for (const key of fields) context[key] = this[key];
      Object.assign(this, previous);
      // The primary context remains the source for shared progression and HUD.
      if (index === 0) for (const key of fields) this[key] = context[key];
    };
  }
  nearestPlayer(point) {
    return this.players.filter(p => !p.dead).sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y))[0] ?? this.players[0];
  }
  selectTarget(point) { return this.enter(this.players.indexOf(this.nearestPlayer(point))); }
  teamDefeated() { return this.players.every(p => p.dead); }
  updatePlayers(dt) {
    for (let i = 0; i < 2; i++) {
      const restore = this.enter(i);
      if (!this.player.dead) {
        this.stageMods = { playerSpeedMult: this.time < this.speedUntil ? 1.5 : 1 };
        if (this.time < this.shieldUntil) { this.player.invincible = true; this.player.invincibleTimer = 0.1; }
        const move = this.input.getMoveVector();
        if (Math.hypot(move.x, move.y) > 0.01) this.shootingPose = shootingPose(move.x, move.y);
        this.player.update(dt, this);
        this.player.x = Math.max(80, Math.min(WORLD.width - 80, this.player.x));
        this.player.y = Math.max(90, Math.min(WORLD.height - 90, this.player.y));
      }
      restore();
    }
    const fallen = this.players.find(p => p.dead), alive = this.players.find(p => !p.dead);
    this.reviveTime = fallen && alive && Math.hypot(fallen.x - alive.x, fallen.y - alive.y) < 85 ? this.reviveTime + dt : 0;
    if (fallen && this.reviveTime >= 3) {
      fallen.dead = false; fallen.hp = fallen.maxHp * 0.5;
      fallen.invincible = true; fallen.invincibleTimer = 3; this.reviveTime = 0;
    }
  }
  specialFor(index) {
    if (this.players[index].dead) return false;
    const restore = this.enter(index); const result = super.special(); restore(); return result;
  }
  offerUpgrades() { super.offerUpgrades(); this.choiceVersion++; }
  choose(id) {
    if (this.state !== 'upgrade' || !this.choices.some(c => c.id === id)) return;
    const choice = this.choices.find(c => c.id === id);
    super.choose(id);
    const guest = this.players[1];
    for (const weapon of this.players[0].weapons) {
      let owned = guest.weapons.find(w => w.id === weapon.id);
      if (!owned) { owned = this.makeWeapon(weapon.def); guest.weapons.push(owned); }
      owned.level = weapon.level;
    }
    guest.passives = { ...this.players[0].passives }; guest.recalculateStats();
    if (choice.kind === 'heal' && !guest.dead) guest.heal(40);
  }
  snapshotFor(index) {
    const shared = super.snapshot();
    const restore = this.enter(index); const local = super.snapshot(); restore();
    return { ...local, hp: this.players[index].dead ? 0 : local.hp, level: shared.level, exp: shared.exp, expToNext: shared.expToNext,
      coop: true, choiceVersion: this.choiceVersion, playerIndex: index, teammateHp: this.players[1 - index].dead ? 0 : Math.ceil(this.players[1 - index].hp),
      teammateMaxHp: this.players[1 - index].maxHp, downed: this.players[index].dead,
      reviveProgress: this.reviveTime / 3 };
  }
}
