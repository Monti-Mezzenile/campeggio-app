export const WORLD = { width: 2816, height: 1536 };
export const ASSETS = {
  player: 'player.png', minion: 'Enemy_minion.png', fast: 'Enemy_fast.png',
  heavy: 'Enemy_heavy.png', stealth: 'Enemy_stealth.png', boss: 'Enemy_boss.png',
  minion2: 'Enemy_minion_2.png', fast2: 'Enemy_fast_2.png', fast3: 'Enemy_fast_3.png',
  heavy2: 'Enemy_heavy_2.png', boss2: 'Enemy_boss_2.png', boss3: 'Enemy_boss_3.png',
  down: 'background_down.png', up: 'background_up.png', carrot: 'carota_xp.png',
  heal: 'medikit.png', ammo: 'munizioni_.png', coffee: 'coffee.png', shield: 'shield.png',
};

// Frames 12–17 are directional shooting poses, not a walk/attack loop.
export function shootingPose(x, y) {
  const length = Math.hypot(x, y);
  if (!length) return 13;
  const side = x / length < -0.35 ? 0 : x / length > 0.35 ? 2 : 1;
  return (y < 0 ? 15 : 12) + side;
}
export function playerFrame(time, specialAt, pose = 13, moving = false) {
  // Special frames have the same six directions as the normal shooting poses.
  if (time >= specialAt && time - specialAt < 0.48) return pose + 6;
  if (moving) {
    const movementPair = { 12: 4, 13: 0, 14: 6, 15: 8, 16: 2, 17: 10 };
    return movementPair[pose] + Math.floor(time * 8) % 2;
  }
  return pose;
}
export const enemyRotation = (enemy, player) => Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.PI / 2;
export const enemyFrame = time => Math.floor(time * 8) % 4;
export const carrotTier = value => value >= 100 ? 'purple' : value >= 25 ? 'gold' : 'orange';
export function enemySprite(enemy) {
  if (enemy.type?.sprite || enemy.sprite) return enemy.type?.sprite || enemy.sprite;
  if (enemy.boss) return 'boss';
  if (enemy.id === 'golem' || enemy.id === 'slime') return 'heavy';
  if (['ghost', 'mage', 'illusionist'].includes(enemy.id)) return 'stealth';
  if (['wolf', 'bat', 'bomber'].includes(enemy.id)) return 'fast';
  return 'minion';
}

export const enemyHasShadow = enemy => enemySprite(enemy).startsWith('fast');

export async function loadAssets(signal) {
  const entries = await Promise.all(Object.entries(ASSETS).map(async ([key, file]) => {
    const img = new Image();
    img.src = `/bullet/${file}`;
    await img.decode();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if ((key === 'player' || file.startsWith('Enemy_')) &&
        (img.naturalHeight !== 128 || img.naturalWidth !== (key === 'player' ? 3072 : 512))) {
      throw new Error(`Spritesheet non valido: ${file}`);
    }
    return [key, img];
  }));
  const images = Object.fromEntries(entries);
  // Cache colour variants once; never apply a filter in the animation loop.
  for (const [tier, filter] of Object.entries({ orange: 'hue-rotate(-22deg) saturate(1.4)', gold: 'none', purple: 'hue-rotate(235deg)' })) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.filter = filter;
    ctx.drawImage(images.carrot, 0, 0);
    images[tier] = canvas;
  }
  const blue = document.createElement('canvas');
  blue.width = images.player.naturalWidth; blue.height = images.player.naturalHeight;
  const blueContext = blue.getContext('2d');
  blueContext.filter = 'hue-rotate(230deg)';
  blueContext.drawImage(images.player, 0, 0);
  images.playerBlue = blue;
  const mask = document.createElement('canvas');
  mask.width = WORLD.width; mask.height = WORLD.height;
  const ctx = mask.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(images.up, 0, 0, mask.width, mask.height);
  const pixels = ctx.getImageData(0, 0, mask.width, mask.height).data;
  const covered = [];
  // Sample opaque canopy, rather than assuming that every map edge is covered.
  for (let y = 24; y < mask.height - 24; y += 16) {
    for (let x = 24; x < mask.width - 24; x += 16) {
      if (pixels[(y * mask.width + x) * 4 + 3] > 240) covered.push({ x, y });
    }
  }
  if (!covered.length) throw new Error('La copertura del bosco non contiene punti di comparsa.');
  return { images, covered };
}
