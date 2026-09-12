import { loadAssets } from './assets.js';
import { attachInput } from './input.js';
import { CoopGame } from './coop-game.js';
import { renderGame } from './renderer.js';
import { encodeCoop, decodeCoop, normalizeMove, interpolateCoop } from './coop-wire.js';

export async function mountCoopGame(canvas, surface, onSnapshot, signal, joystick, connection) {
  const { images, covered } = await loadAssets(signal);
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponibile.');
  const host = connection.role === 'host';
  const game = new CoopGame(covered);
  game.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let interpolationFrom = null, interpolationTo = null, interpolationAt = 0;
  let scene = game, snapshot = game.snapshotFor(host ? 0 : 1);
  let frame = 0, disposed = false, width = 480, height = 600, previous = performance.now(), accumulator = 0;
  let lastSend = 0, lastPublish = 0, lastHeard = 0, lastMove = 0, sequence = 0, receivedSequence = -1;
  let remoteMove = { x: 0, y: 0 }, runId = '', remoteClient = '', commandSequence = -1;
  const clientId = crypto.randomUUID();
  let hostEpoch = '';
  const connected = () => lastHeard > 0 && performance.now() - lastHeard < 3000;
  const publish = () => {
    if (host) snapshot = game.snapshotFor(0);
    onSnapshot({ ...snapshot, coop: true, playerIndex: host ? 0 : 1, runId, peerConnected: connected() });
  };
  const sendGuest = command => connection.send({ clientId, sequence: ++sequence, runId, move: input.getMoveVector(), command, choiceVersion: snapshot.choiceVersion });
  const command = (type, value) => {
    if (!host) {
      if (type === 'finish' && !connected()) { snapshot = { ...snapshot, state: 'over' }; publish(); }
      else sendGuest({ type, value });
      return;
    }
    if (type === 'special') game.specialFor(0);
    if (type === 'pause') { if (game.state !== 'paused' || connected()) game.pause(value); }
    if (type === 'choose') game.choose(value);
    if (type === 'finish') game.finish();
    publish();
  };
  const input = attachInput(surface, canvas, joystick, {
    canMove: () => (host ? game.state : snapshot.state) === 'playing' && connected(),
    special: () => command('special'), pause: force => command('pause', force),
  });
  const bindInputs = () => {
    game.input = input; game.contexts[0].input = input;
    game.contexts[1].input = { getMoveVector: () => performance.now() - lastMove < 350 ? remoteMove : { x: 0, y: 0 }, clear() { remoteMove = { x: 0, y: 0 }; } };
  };
  bindInputs();
  const unlisten = connection.listen(packet => {
    if (!packet || typeof packet !== 'object' || disposed) return;
    if (host) {
      if (typeof packet.clientId !== 'string' || !Number.isSafeInteger(packet.sequence)) return;
      if (packet.clientId !== remoteClient) { remoteClient = packet.clientId; commandSequence = -1; }
      if (packet.sequence <= commandSequence) return;
      commandSequence = packet.sequence; lastHeard = performance.now(); lastMove = lastHeard;
      remoteMove = normalizeMove(packet.move);
      if (packet.runId !== runId || !packet.command) return;
      const { type, value } = packet.command;
      if (type === 'special') game.specialFor(1);
      else if (type === 'pause') game.pause(Boolean(value));
      else if (type === 'choose' && typeof value === 'string' && packet.choiceVersion === game.choiceVersion) game.choose(value);
      else if (type === 'finish') game.finish();
    } else {
      if (typeof packet.hostEpoch !== 'string') return;
      if (packet.hostEpoch !== hostEpoch) { hostEpoch = packet.hostEpoch; receivedSequence = -1; }
      if (!Number.isSafeInteger(packet.sequence) || packet.sequence <= receivedSequence || !packet.snapshot || packet.players?.length !== 2 || !Array.isArray(packet.contexts)) return;
      receivedSequence = packet.sequence; lastHeard = performance.now();
      runId = packet.runId; snapshot = packet.snapshot;
      if (snapshot.state !== 'playing') input.clear();
      interpolationFrom = scene; interpolationTo = decodeCoop(packet, game.reducedMotion); interpolationAt = performance.now();
      scene = interpolationTo;
      publish();
    }
  });
  const resize = () => {
    const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const ratio = rect.width / rect.height;
    height = Math.min(600, 1200 / ratio); width = height * ratio;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  const tick = now => {
    if (disposed) return;
    const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000)); previous = now;
    if (host) {
      if (!connected() && game.state === 'playing') game.pause(true);
      if (game.state === 'playing') {
        accumulator += dt;
        while (accumulator >= 1 / 60) { game.update(1 / 60); accumulator -= 1 / 60; }
      } else accumulator = 0;
    } else if (!connected() && snapshot.state === 'playing') snapshot = { ...snapshot, state: 'paused' };
    if (now - lastSend >= (host ? 80 : 60)) {
      lastSend = now;
      if (host) connection.send({ ...encodeCoop(game, ++sequence, runId), hostEpoch: clientId });
      else sendGuest();
    }
    if (!host && interpolationTo) scene = interpolateCoop(interpolationFrom, interpolationTo, Math.min(1, (now - interpolationAt) / 80));
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    renderGame(ctx, scene, images, width, height);
    if (now - lastPublish >= 100) { lastPublish = now; publish(); }
    frame = requestAnimationFrame(tick);
  };
  const destroy = () => {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); unlisten(); input.destroy();
    signal.removeEventListener('abort', destroy);
  };
  signal.addEventListener('abort', destroy, { once: true });
  publish(); frame = requestAnimationFrame(tick);
  return {
    start() { if (!host || !connected()) return; game.start(); bindInputs(); runId = crypto.randomUUID(); accumulator = 0; publish(); canvas.focus({ preventScroll: true }); },
    special() { command('special'); }, pause() { command('pause'); }, choose(id) { command('choose', id); },
    finish() { command('finish'); }, destroy,
  };
}
