// Mascot XP is separate from each game's leaderboard score. All games share
// an active-playtime ceiling, with no starting bonus that rewards quick restarts.
const positive = value => Number.isFinite(value) ? Math.max(0, value) : 0;
export const MAX_GAME_XP_PER_MINUTE = 36;
const limit = (earned, seconds) => Math.floor(Math.min(positive(earned), positive(seconds) * MAX_GAME_XP_PER_MINUTE / 60));
export const grillReward = (served, seconds) => limit(Math.floor(positive(served)) * 2, seconds);
export const runnerReward = (score, seconds) => limit(positive(score) / 120, seconds);
export const mergeReward = (score, seconds) => limit(positive(score) / 25, seconds);
export const bulletReward = (kills, seconds) => limit(2 * (Math.floor(positive(kills) / 4) + Math.floor(positive(seconds) / 6)), seconds);
