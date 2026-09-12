import { mountCoopGame } from './coop-runtime.js';
import { loadAssets } from './assets.js';
import { attachInput } from './input.js';
import { BulletGame } from './game.js';
import { renderGame } from './renderer.js';

export async function mountBulletGame(canvas, surface, onSnapshot, signal, joystick, connection) {
  if (connection) return mountCoopGame(canvas, surface, onSnapshot, signal, joystick, connection);
  const { images, covered } = await loadAssets(signal);
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponibile su questo dispositivo.');
  const game = new BulletGame(covered);
  game.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let disposed = false, frame = 0, width = 480, height = 600, dpr = 1;
  let previous = performance.now(), accumulator = 0, lastSnapshot = 0;
  let previousState = game.state;
  const publish = () => { if (!disposed) onSnapshot(game.snapshot()); };
  game.input = attachInput(surface, canvas, joystick, {
    canMove: () => game.state === 'playing',
    special: () => { game.special(); publish(); },
    pause: force => { game.pause(force); publish(); },
  });
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = rect.width / rect.height;
    height = Math.min(600, 1200 / ratio); width = height * ratio;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  const tick = now => {
    if (disposed) return;
    const elapsed = Math.min(0.05, Math.max(0, (now - previous) / 1000)); previous = now;
    if (game.state === 'playing') {
      accumulator += elapsed;
      while (accumulator >= 1 / 60) { game.update(1 / 60); accumulator -= 1 / 60; }
    } else accumulator = 0;
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    renderGame(ctx, game, images, width, height);
    if (now - lastSnapshot >= 100 || game.state !== previousState) {
      previousState = game.state; lastSnapshot = now; publish();
    }
    frame = requestAnimationFrame(tick);
  };
  const destroy = () => {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); game.input.destroy();
    signal.removeEventListener('abort', destroy);
  };
  signal.addEventListener('abort', destroy, { once: true });
  publish(); frame = requestAnimationFrame(tick);
  return {
    start() { game.start(); previous = performance.now(); accumulator = 0; publish(); canvas.focus({ preventScroll: true }); },
    pause() { game.pause(); publish(); if (game.state === 'playing') canvas.focus({ preventScroll: true }); },
    special() { game.special(); publish(); canvas.focus({ preventScroll: true }); },
    choose(id) { game.choose(id); publish(); if (game.state === 'playing') canvas.focus({ preventScroll: true }); },
    finish() { game.finish(); publish(); },
    destroy,
  };
}
