'use client';

import { useEffect, useState } from 'react';
import { POSE_INTERVAL } from '@/lib/mascot-evolution';

// Wall-clock slots survive reloads and background tabs without writing to the database.
export function usePoseClock() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const sync = () => {
      clearTimeout(timer);
      const time = Date.now();
      setNow(time);
      timer = setTimeout(sync, POSE_INTERVAL - time % POSE_INTERVAL + 20);
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', sync); };
  }, []);
  return now;
}
