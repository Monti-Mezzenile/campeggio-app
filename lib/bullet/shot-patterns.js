import { Weapon } from './core/weapons.js';
import { Projectile } from './core/entities.js';

export const SHOT_WEAPONS = [
  { id: 'fan', name: 'Ventaglio selvaggio', type: 'pattern', baseDamage: 11, baseCooldown: 1.1, baseRange: 430, speed: 390, counts: [3, 5, 7], color: '#f4d589' },
  { id: 'hedgehog', name: 'Riccio furioso', type: 'pattern', baseDamage: 14, baseCooldown: 2.8, baseRange: 400, speed: 270, piercing: true, counts: [8, 12, 16], color: '#c6db8c' },
  { id: 'carrot_bomb', name: 'Carota esplosiva', type: 'pattern', baseDamage: 30, baseCooldown: 2.2, baseRange: 480, speed: 280, explode: true, counts: [1, 2, 3], color: '#efa55f' },
  { id: 'return_blade', name: 'Falce di ritorno', type: 'pattern', baseDamage: 22, baseCooldown: 2, baseRange: 520, speed: 330, piercing: true, counts: [1, 2, 3], color: '#9bd8bb' },
];

class ReturningProjectile extends Projectile {
  update(dt, game) {
    if (!this.returning && this.travelDist >= this.maxDist * 0.45) {
      this.returning = true;
      this.hitEnemies.clear(); // A second hit is possible on the return journey.
    }
    if (this.returning) {
      this.angle = Math.atan2((this.owner ?? game.player).y - this.y, (this.owner ?? game.player).x - this.x);
      this.vx = Math.cos(this.angle) * this.speed; this.vy = Math.sin(this.angle) * this.speed;
      if (Math.hypot((this.owner ?? game.player).x - this.x, (this.owner ?? game.player).y - this.y) < this.speed * dt + 20) {
        this.shouldRemove = true; return;
      }
      // Returning blades track the moving player, with lifetime as the safety cap.
      this.maxDist = Infinity;
    }
    super.update(dt, game);
  }
}

export class PatternWeapon extends Weapon {
  fire(player, game) {
    const target = game.spatial.findNearestEnemy(player.x, player.y, this.getRange(player));
    if (!target) return;
    const aim = Math.atan2(target.y - player.y, target.x - player.x);
    const count = this.def.counts[this.level - 1];
    const definition = { ...this.def, baseRange: this.getRange(player) / player.getAreaMult(), explodeRadius: [65, 90, 115][this.level - 1] };
    for (let i = 0; i < count && game.projectiles.length < 350; i++) {
      const angle = this.id === 'hedgehog' ? aim + i * Math.PI * 2 / count : aim + (i - (count - 1) / 2) * (this.id === 'fan' ? 0.18 : 0.28);
      const Shot = this.id === 'return_blade' ? ReturningProjectile : Projectile;
      const p = new Shot(player.x, player.y, angle, definition, this.getDamage(player), this.level, player);
      p.color = this.def.color;
      game.projectiles.push(p);
    }
    game.audio.shoot();
  }
}
