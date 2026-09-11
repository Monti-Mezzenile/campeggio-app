const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

// Keyboard belongs to the game surface; touch movement belongs only to the pad.
export function attachInput(surface, canvas, joystick, { special, pause, canMove }) {
  const keys = new Set();
  let pointer = null;
  let touch = { x: 0, y: 0 };
  const release = () => {
    const captured = pointer;
    pointer = null;
    touch = { x: 0, y: 0 };
    joystick.style.setProperty('--stick-x', '0px');
    joystick.style.setProperty('--stick-y', '0px');
    if (captured !== null && joystick.hasPointerCapture(captured)) joystick.releasePointerCapture(captured);
  };
  const clear = () => { keys.clear(); release(); };
  const keydown = event => {
    if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea, select, a')) return;
    if (MOVE_KEYS.has(event.code) || event.code === 'Space' || event.code === 'Escape') {
      event.preventDefault();
      if (MOVE_KEYS.has(event.code) && canMove()) keys.add(event.code);
      if (!event.repeat && event.code === 'Space') special();
      if (!event.repeat && event.code === 'Escape') pause();
    }
  };
  const keyup = event => { keys.delete(event.code); };
  const updateStick = event => {
    const rect = joystick.getBoundingClientRect();
    const radius = Math.max(12, Math.min(rect.width, rect.height) * 0.28);
    const x = (event.clientX - rect.left - rect.width / 2) / radius;
    const y = (event.clientY - rect.top - rect.height / 2) / radius;
    const length = Math.hypot(x, y);
    const limit = Math.max(1, length);
    touch = length < 0.12 ? { x: 0, y: 0 } : { x: x / limit, y: y / limit };
    joystick.style.setProperty('--stick-x', `${touch.x * radius}px`);
    joystick.style.setProperty('--stick-y', `${touch.y * radius}px`);
  };
  const down = event => {
    if (pointer !== null || !canMove()) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    pointer = event.pointerId;
    joystick.setPointerCapture(pointer);
    updateStick(event);
  };
  const move = event => {
    if (event.pointerId !== pointer) return;
    event.preventDefault();
    updateStick(event);
  };
  const up = event => { if (event.pointerId === pointer) release(); };
  const blur = event => { // Mobile browsers can report null when a control becomes disabled or loses focus.
    // Window blur/visibility already cover leaving the app; a null target is not a pause.
    if (event.relatedTarget && !surface.contains(event.relatedTarget)) { clear(); pause(true); } };
  const hidden = () => { if (document.hidden) { clear(); pause(true); } };
  const windowBlur = () => { clear(); pause(true); };
  surface.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  surface.addEventListener('focusout', blur);
  joystick.addEventListener('pointerdown', down);
  joystick.addEventListener('pointermove', move);
  joystick.addEventListener('pointerup', up);
  joystick.addEventListener('pointercancel', up);
  joystick.addEventListener('lostpointercapture', up);
  window.addEventListener('blur', windowBlur);
  document.addEventListener('visibilitychange', hidden);
  return {
    clear,
    getMoveVector() {
      let x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + touch.x;
      let y = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + touch.y;
      const length = Math.max(1, Math.hypot(x, y));
      x /= length; y /= length;
      return { x, y };
    },
    destroy() {
      clear();
      surface.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      surface.removeEventListener('focusout', blur);
      joystick.removeEventListener('pointerdown', down);
      joystick.removeEventListener('pointermove', move);
      joystick.removeEventListener('pointerup', up);
      joystick.removeEventListener('pointercancel', up);
      joystick.removeEventListener('lostpointercapture', up);
      window.removeEventListener('blur', windowBlur);
      document.removeEventListener('visibilitychange', hidden);
    },
  };
}
