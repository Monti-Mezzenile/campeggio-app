'use client';

import { useLayoutEffect, useRef } from 'react';

/** Fits a single line to its actual container, including after rotation or font loading. */
export default function FitText({ children, size, className = '' }: { children: string; size: number; className?: string }) {
  const container = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const outer = container.current, inner = text.current;
    if (!outer || !inner) return;
    let active = true;
    const fit = () => {
      if (!active || outer.clientWidth === 0) return;
      inner.style.fontSize = `${size}px`;
      const naturalWidth = inner.getBoundingClientRect().width;
      inner.style.fontSize = `${Math.min(size, size * outer.clientWidth / Math.max(1, naturalWidth))}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    void document.fonts.ready.then(fit);
    return () => { active = false; observer.disconnect(); };
  }, [children, size]);
  return <span ref={container} className={`block min-w-0 ${className}`}><span ref={text} style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: size, lineHeight: 1.3 }}>{children}</span></span>;
}
