export type FoodType = 'salsiccia' | 'bistecca' | 'hamburger' | 'spiedino' | 'pannocchia' | 'zucchina';
export type CookState = 'crudo' | 'cotto' | 'bruciato';
export const getFoodImagePath = (food: FoodType, state: CookState) => {
  // The supplied cooked skewer asset has a capital S (case-sensitive in production).
  if (food === 'spiedino' && state === 'cotto') return '/grigliata/Spiedino_cotto.png';
  const suffix = food === 'hamburger' || food === 'spiedino' ? state : state.replace(/o$/, 'a');
  return `/grigliata/${food}_${suffix}.png`;
};

// Elapsed time is in milliseconds and never resets during a run.
export function getDifficulty(elapsed: number) {
  const allowedFoods: FoodType[] = ['salsiccia', 'zucchina'];
  if (elapsed >= 45000) allowedFoods.push('hamburger');
  if (elapsed >= 90000) allowedFoods.push('pannocchia', 'spiedino');
  if (elapsed >= 150000) allowedFoods.push('bistecca');
  const extra = Math.min(1, Math.max(0, (elapsed - 240000) / 240000));
  return {
    allowedFoods,
    maxOrders: elapsed < 45000 ? 2 : elapsed < 150000 ? 3 : elapsed < 240000 ? 4 : elapsed < 360000 ? 5 : 6,
    orderInterval: elapsed < 45000 ? 4500 : elapsed < 90000 ? 4000 : elapsed < 150000 ? 3200 : 2700 - extra * 700,
    cookSpeed: elapsed < 45000 ? 1 : elapsed < 150000 ? 1.15 : 1.5 + extra * 0.5,
  };
}

export const FOOD_NAMES: Record<FoodType, string> = {
  salsiccia: 'Salsiccia',
  bistecca: 'Bistecca',
  hamburger: 'Hamburger',
  spiedino: 'Spiedino',
  pannocchia: 'Pannocchia',
  zucchina: 'Zucchina',
};


export interface GrillSlot { id: number; foodType: FoodType; elapsed: number; state: CookState }
export interface Order { id: number; foodType: FoodType; timeLeft: number; maxTime: number }
export interface GrillGame {
  phase: 'START' | 'PLAYING' | 'GAMEOVER';
  score: number;
  elapsed: number;
  lives: number;
  combo: number;
  served: number;
  slots: (GrillSlot | null)[];
  orders: Order[];
  spawnElapsed: number;
  nextId: number;
  run: number;
}
export const initialGrillGame: GrillGame = {
  phase: 'START', score: 0, elapsed: 0, lives: 3, combo: 0,
  served: 0, slots: Array(6).fill(null), orders: [], spawnElapsed: 0, nextId: 1, run: 0,
};
export const cookingTimes = (elapsed: number) => ({
  ready: 6000 / getDifficulty(elapsed).cookSpeed,
  burnt: 6000 / getDifficulty(elapsed).cookSpeed + Math.max(3000, 5000 / getDifficulty(elapsed).cookSpeed),
});
export type GrillAction =
  | { type: 'START'; random: number }
  | { type: 'TICK'; milliseconds: number; random: number }
  | { type: 'PLACE'; food: FoodType }
  | { type: 'SERVE'; index: number }
  | { type: 'DISCARD'; index: number };

const newOrder = (game: GrillGame, random: number): Order => {
  const foods = getDifficulty(game.elapsed).allowedFoods;
  const food = foods[Math.min(foods.length - 1, Math.max(0, Math.floor(random * foods.length)))];
  return { id: game.nextId, foodType: food, timeLeft: 20000, maxTime: 20000 };
};

// Pure transitions keep timer ticks, double taps and life losses atomic.
export function grillReducer(game: GrillGame, action: GrillAction): GrillGame {
  if (action.type === 'START') {
    if (game.phase !== 'START' && game.phase !== 'GAMEOVER') return game;
    const next: GrillGame = {
      ...initialGrillGame, phase: 'PLAYING', slots: Array(6).fill(null),
      run: game.run + 1, nextId: game.nextId + 1,
    };
    return { ...next, orders: [newOrder(next, action.random)] };
  }
  if (game.phase !== 'PLAYING') return game;
  if (action.type === 'PLACE') {
    if (!getDifficulty(game.elapsed).allowedFoods.includes(action.food)) return game;
    const index = game.slots.findIndex(slot => slot === null);
    if (index < 0) return game;
    const slots = [...game.slots];
    slots[index] = { id: game.nextId + 1, foodType: action.food, state: 'crudo', elapsed: 0 };
    return { ...game, slots, nextId: game.nextId + 1 };
  }
  if (action.type === 'SERVE' || action.type === 'DISCARD') {
    const slot = game.slots[action.index];
    if (!slot) return game;
    const slots = [...game.slots];
    if (action.type === 'DISCARD') {
      if (slot.state !== 'bruciato') return game;
      slots[action.index] = null;
      const lives = Math.max(0, game.lives - 1);
      return { ...game, slots, lives, combo: 0, phase: lives ? 'PLAYING' : 'GAMEOVER' };
    }
    const orderIndex = game.orders.findIndex(order => order.foodType === slot.foodType);
    if (slot.state !== 'cotto' || orderIndex < 0) return game;
    slots[action.index] = null;
    return {
      ...game, slots, orders: game.orders.filter((_, index) => index !== orderIndex),
      score: game.score + Math.round(35 * (1 + game.combo * 0.2)),
      combo: game.combo + 1, served: game.served + 1,
    };
  }
  const dt = Math.max(0, action.milliseconds);
  const elapsed = game.elapsed + dt;
  const difficulty = getDifficulty(elapsed);
  const times = cookingTimes(elapsed);
  const slots = game.slots.map(slot => {
    if (!slot || slot.state === 'bruciato') return slot;
    const elapsed = slot.elapsed + dt;
    const state: CookState = elapsed >= times.burnt ? 'bruciato' : elapsed >= times.ready ? 'cotto' : 'crudo';
    return { ...slot, elapsed, state };
  });
  const expired = game.orders.filter(order => order.timeLeft <= dt).length;
  let orders = game.orders.filter(order => order.timeLeft > dt).map(order => ({ ...order, timeLeft: order.timeLeft - dt }));
  const lives = Math.max(0, game.lives - expired);
  const phase = lives === 0 ? 'GAMEOVER' : 'PLAYING';
  let spawnElapsed = game.spawnElapsed + dt;
  let nextId = game.nextId;
  if (phase === 'PLAYING' && spawnElapsed >= difficulty.orderInterval) {
    spawnElapsed = 0;
    if (orders.length < difficulty.maxOrders) {
      nextId++;
      orders = [...orders, newOrder({ ...game, elapsed, nextId }, action.random)];
    }
  }
  return { ...game, phase, slots, orders, lives, elapsed, combo: expired ? 0 : game.combo, spawnElapsed, nextId };
}
