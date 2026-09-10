'use client';

import { useEffect, useRef, type RefObject } from 'react';

export const RUNNER_ROAD_HEIGHT = 132;

/** One decoded video per theme, repeated horizontally without gaps. */
export default function RunnerLandscape({ distanceRef, darkness, playing }: { distanceRef: RefObject<number>; darkness: number; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dayRef = useRef<HTMLVideoElement>(null);
  const nightRef = useRef<HTMLVideoElement>(null);
  const state = useRef({ darkness, playing });
  useEffect(() => { state.current = { darkness, playing }; }, [darkness, playing]);
  const showDay = darkness < 1;
  const showNight = darkness > 0;
  useEffect(() => {
    const syncPlayback = () => {
      for (const [video, visible] of [[dayRef.current, showDay], [nightRef.current, showNight]] as const) {
        if (!video) continue;
        video.playbackRate = 0.55;
        if (playing && visible && !document.hidden) void video.play().catch(() => {});
        else video.pause();
      }
    };
    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    const videos = [dayRef.current, nightRef.current];
    videos.forEach(video => video?.addEventListener('loadeddata', syncPlayback));
    return () => {
      document.removeEventListener('visibilitychange', syncPlayback);
      videos.forEach(video => { video?.removeEventListener('loadeddata', syncPlayback); video?.pause(); });
    };
  }, [playing, showDay, showNight]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dayRoad = new Image(), nightRoad = new Image();
    dayRoad.src = '/runner/base_giorno.png';
    nightRoad.src = '/runner/base_notte.png';
    // Keep the last decoded picture while a loop seeks back to its first frame.
    const videoFrames = new Map<HTMLVideoElement, { canvas: HTMLCanvasElement; time: number }>();
    const sample = document.createElement('canvas');
    sample.width = 16; sample.height = 16;
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    const getVideoFrame = (video: HTMLVideoElement) => {
      const previous = videoFrames.get(video);
      if (video.seeking || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return previous?.canvas;
      if (previous && Math.abs(previous.time - video.currentTime) < 1 / 24) return previous.canvas;
      const cropHeight = Math.min(520, video.videoHeight);
      // Reject black frames if the decoder or clip emits them at a loop boundary.
      if (sampleCtx && (!previous || video.currentTime < 0.3 || (Number.isFinite(video.duration) && video.duration - video.currentTime < 0.3))) {
        sampleCtx.drawImage(video, 0, 0, video.videoWidth, cropHeight, 0, 0, 16, 16);
        const pixels = sampleCtx.getImageData(0, 0, 16, 16).data;
        let lit = 0;
        for (let i = 0; i < pixels.length; i += 4) if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) > 8) lit++;
        if (lit < 4) return previous?.canvas;
      }
      const buffer = previous?.canvas ?? document.createElement('canvas');
      // Cache at display resolution, not the full video resolution.
      const cacheHeight = Math.max(1, Math.ceil(height - RUNNER_ROAD_HEIGHT));
      const cacheWidth = Math.max(1, Math.ceil(video.videoWidth * cacheHeight / cropHeight));
      if (buffer.width !== cacheWidth || buffer.height !== cacheHeight) {
        buffer.width = cacheWidth; buffer.height = cacheHeight;
      }
      buffer.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, cropHeight, 0, 0, cacheWidth, cacheHeight);
      videoFrames.set(video, { canvas: buffer, time: video.currentTime });
      return buffer;
    };
    let width = 0, height = 0, frame = 0;
    const resize = new ResizeObserver(() => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    resize.observe(canvas);
    const tile = (source: CanvasImageSource, sw: number, sh: number, top: number, targetHeight: number, offset: number) => {
      // Trim border pixels and overlap neighbours so filtering cannot expose a dark seam.
      const trim = Math.min(2, sw / 10);
      const tileWidth = (sw - trim * 2) * targetHeight / sh;
      const overlap = 10;
      const stride = Math.max(1, tileWidth - overlap);
      const start = -((offset % stride + stride) % stride) - stride;
      for (let x = start; x < width; x += stride) {
        // Fade the first 10px over the preceding tile, instead of a hard edge.
        const sourceScale = (sw - trim * 2) / tileWidth;
        ctx.drawImage(source, trim + overlap * sourceScale, 0, sw - trim * 2 - overlap * sourceScale, sh, x + overlap, top, tileWidth - overlap, targetHeight);
        const alpha = ctx.globalAlpha;
        for (let strip = 0; strip < overlap; strip++) {
          ctx.globalAlpha = alpha * (strip + 1) / overlap;
          ctx.drawImage(source, trim + strip * sourceScale, 0, sourceScale, sh, x + strip, top, 1.1, targetHeight);
        }
        ctx.globalAlpha = alpha;
      }
    };
    const softenedRoads = new Map<HTMLImageElement, HTMLCanvasElement>();
    const softenRoad = (road: HTMLImageElement) => {
      const saved = softenedRoads.get(road);
      if (saved) return saved;
      const buffer = document.createElement('canvas');
      buffer.height = RUNNER_ROAD_HEIGHT + 8;
      buffer.width = Math.round(road.naturalWidth * buffer.height / road.naturalHeight);
      const paint = buffer.getContext('2d')!;
      paint.drawImage(road, 0, 0, buffer.width, buffer.height);
      paint.globalCompositeOperation = 'destination-in';
      const fade = paint.createLinearGradient(0, 0, 0, 8);
      fade.addColorStop(0, 'transparent'); fade.addColorStop(1, '#000');
      paint.fillStyle = fade; paint.fillRect(0, 0, buffer.width, buffer.height);
      softenedRoads.set(road, buffer);
      return buffer;
    };
    let lastDraw = -Infinity;
    const draw = (timestamp: number) => {
      frame = requestAnimationFrame(draw);
      // Scroll at display cadence; only video decoding is capped at 24 fps.
      if (document.hidden || timestamp - lastDraw < 1000 / 60 - 1) return;
      lastDraw = timestamp;
      const { darkness } = state.current;
      const distance = distanceRef.current ?? 0;
      const skyHeight = Math.max(1, height - RUNNER_ROAD_HEIGHT);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#18232b'; ctx.fillRect(0, 0, width, height);
      const sky = (video: HTMLVideoElement | null, alpha: number) => {
        if (!video || alpha <= 0) return;
        const cached = getVideoFrame(video);
        if (!cached) return;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, width, skyHeight); ctx.clip();
        ctx.globalAlpha = alpha;
        tile(cached, cached.width, cached.height, 0, skyHeight, distance * 0.25);
        ctx.restore();
      };
      if (darkness < 1) sky(dayRef.current, 1);
      sky(nightRef.current, darkness);
      ctx.fillStyle = '#51452f'; ctx.fillRect(0, skyHeight, width, RUNNER_ROAD_HEIGHT);
      for (const [road, alpha] of [[dayRoad, 1], [nightRoad, darkness]] as const) {
        if (alpha <= 0 || (road === dayRoad && darkness === 1) || !road.complete || !road.naturalWidth) continue;
        ctx.globalAlpha = alpha;
        const softened = softenRoad(road);
        tile(softened, softened.width, softened.height, skyHeight - 8, RUNNER_ROAD_HEIGHT + 8, distance);
      }
      ctx.globalAlpha = 1;
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); };
  }, [distanceRef]);
  return <>
    <video ref={dayRef} loop muted playsInline preload="auto" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover pointer-events-none" src="/runner-bg.mp4" />
    <video ref={nightRef} loop muted playsInline preload="auto" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover pointer-events-none" src="/runner-bg-night.mp4" />
    <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />
  </>;
}
