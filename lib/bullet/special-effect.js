export const SHOCKWAVE_DURATION = 1.05;
export function drawShockwave(ctx, origin, age, reducedMotion = false) {
  if (!origin || age < 0 || age >= SHOCKWAVE_DURATION) return;
  const progress = age / SHOCKWAVE_DURATION;
  const fade = Math.pow(1 - progress, 0.7);
  const radius = reducedMotion ? 240 : 240 * (1 - Math.pow(1 - progress, 3));
  ctx.save();
  ctx.globalAlpha = fade;
  // Antique gold and pale jade match the woodland palette. No screen flashes.
  const glow = ctx.createRadialGradient(origin.x, origin.y, radius * 0.58, origin.x, origin.y, Math.max(1, radius));
  glow.addColorStop(0, '#9ac79900'); glow.addColorStop(0.72, '#a5d1a338'); glow.addColorStop(0.94, '#edd59790'); glow.addColorStop(1, '#fff0bc00');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(origin.x, origin.y, radius, 0, Math.PI * 2); ctx.fill();
  for (const [scale, color, width] of [[1, '#f9e5ac', 7], [0.92, '#9fccb0', 3], [0.76, '#dcc281', 2]]) {
    ctx.strokeStyle = color; ctx.lineWidth = width * (1 - progress * 0.65);
    ctx.beginPath(); ctx.arc(origin.x, origin.y, radius * scale, 0, Math.PI * 2); ctx.stroke();
  }
  if (!reducedMotion) {
    for (let i = 0; i < 24; i++) {
      const angle = i * Math.PI / 12;
      const inner = radius * (0.83 + (i % 3) * 0.025);
      ctx.strokeStyle = i % 2 ? '#e5d5a0' : '#b8d6ae'; ctx.lineWidth = i % 3 ? 2 : 4;
      ctx.beginPath(); ctx.moveTo(origin.x + Math.cos(angle) * inner, origin.y + Math.sin(angle) * inner);
      ctx.lineTo(origin.x + Math.cos(angle) * radius, origin.y + Math.sin(angle) * radius); ctx.stroke();
    }
  }
  ctx.restore();
}
