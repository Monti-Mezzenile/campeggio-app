export interface BulletSnapshot {
  state: 'ready' | 'playing' | 'paused' | 'upgrade' | 'over';
  seconds: number; kills: number; hp: number; maxHp: number; level: number;
  exp: number; expToNext: number; specialIn: number; shield: number; speed: number;
  wave: { number: number; title: string; breather: boolean; secondsLeft: number };
  bosses: { id: string; name: string; hp: number; maxHp: number; attacking: boolean; enraged: boolean }[];
  boss: { name: string; hp: number; maxHp: number; attacking: boolean; enraged: boolean } | null;
  xp: number; score: number; specialCharge: number;
  choices: { id: string; label: string; description: string; kind: string; level: number; maxLevel: number }[];
}
export interface BulletController {
  start(): void; pause(): void; special(): void; choose(id: string): void;
  finish(): void; destroy(): void;
}
export function mountBulletGame(canvas: HTMLCanvasElement, surface: HTMLElement, onSnapshot: (snapshot: BulletSnapshot) => void, signal: AbortSignal, joystick: HTMLElement): Promise<BulletController>;
