'use client';

import { useEffect, useRef } from 'react';

export const RUNNER_ROAD_HEIGHT = 132;

/** One decoded video per theme, repeated horizontally without gaps. */
export default function RunnerLandscape({ distance, darkness, playing }: { distance: number; darkness: number; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dayRef = useRef<HTMLVideoElement>(null);
  const nightRef = useRef<HTMLVideoElement>(null);
  const state = useRef({ distance, darkness, playing });
  useEffect(() => { state.current = { distance, darkness, playing }; }, [distance, darkness, playing]);
  useEffect(() => {
    for (const video of [dayRef.current, nightRef.current]) {
      if (!video) continue;
      video.playbackRate = 0.55;
      if (playing) void video.play().catch(() => {});
      else video.pause();
    }
  }, [playing]);
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
      if (previous?.time === video.currentTime) return previous.canvas;
      const cropHeight = Math.min(520, video.videoHeight);
      // Reject black frames if the decoder or clip emits them at a loop boundary.
      if (sampleCtx) {
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
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    resize.observe(canvas);
    const tile = (source: CanvasImageSource, sw: number, sh: number, top: number, targetHeight: number, offset: number) => {
      // Trim border pixels and overlap neighbours so filtering cannot expose a dark seam.
      const trim = Math.min(2, sw / 10);
      const tileWidth = (sw - trim * 2) * targetHeight / sh;
      const stride = Math.max(1, tileWidth - 2);
      const start = -((offset % stride + stride) % stride);
      for (let x = start; x < width; x += stride) {
        ctx.drawImage(source, trim, 0, sw - trim * 2, sh, x, top, tileWidth, targetHeight);
      }
    };
    const draw = () => {
      const { distance, darkness } = state.current;
      const skyHeight = Math.max(1, height - RUNNER_ROAD_HEIGHT);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#18232b'; ctx.fillRect(0, 0, width, height);
      const sky = (video: HTMLVideoElement | null, alpha: number) => {
        if (!video) return;
        const cached = getVideoFrame(video);
        if (!cached) return;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, width, skyHeight); ctx.clip();
        ctx.globalAlpha = alpha;
        tile(cached, cached.width, cached.height, 0, skyHeight, distance * 0.25);
        ctx.restore();
      };
      sky(dayRef.current, 1);
      sky(nightRef.current, darkness);
      ctx.fillStyle = '#51452f'; ctx.fillRect(0, skyHeight, width, RUNNER_ROAD_HEIGHT);
      for (const [road, alpha] of [[dayRoad, 1], [nightRoad, darkness]] as const) {
        if (!road.complete || !road.naturalWidth) continue;
        ctx.globalAlpha = alpha;
        tile(road, road.naturalWidth, road.naturalHeight, skyHeight, RUNNER_ROAD_HEIGHT, distance);
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); };
  }, []);
  return <>
    <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />
    <video ref={dayRef} loop muted playsInline preload="auto" aria-hidden="true" className="absolute w-px h-px opacity-0 pointer-events-none" src="/runner-bg.mp4" />
    <video ref={nightRef} loop muted playsInline preload="auto" aria-hidden="true" className="absolute w-px h-px opacity-0 pointer-events-none" src="/runner-bg-night.mp4" />
  </>;
}
