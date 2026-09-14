// Cost from the current level to the next. The first two upgrades stay quick;
// later costs keep growing instead of flattening at a fixed XP ceiling.
export function levelXpCost(level, cooperative = false) {
  const step = Math.max(0, Math.floor(level) - 3);
  const base = level <= 1 ? 100 : level === 2 ? 135 : 240 + 120 * step + 30 * step * step;
  return Math.ceil(base * (cooperative ? 1.4 : 1));
}
export const NORMAL_PICKUP_CHANCE = 0.06;
export const availableUpgradeTier = bossKills => bossKills >= 2 ? 3 : 2;
