// Adapted from Survivor Game (MIT; see ../LICENSE). Only engine constants used
// by the embedded game are retained; viewport projection belongs to runtime.js.
import { WORLD } from '../assets.js';

export const CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,
  ARENA_WIDTH: WORLD.width,
  ARENA_HEIGHT: WORLD.height,
  PLAYER_SPEED: 240,
  PLAYER_SIZE: 20,
  MAX_ENEMIES: 300,
  EXP_ORB_LIFETIME: 30,
  INVINCIBILITY_TIME: 0.5,
  PICKUP_DISTANCE: 24,
  MAGNET_BASE: 120,
  MAX_WEAPONS: 6,
  WEAPON_MAX_LEVEL: 5,
  PASSIVE_MAX_STACK: 5,
  DT_CLAMP: 0.05,
};
