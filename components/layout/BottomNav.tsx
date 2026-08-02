'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CustomIcon from '@/components/ui/CustomIcon';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 🎯 RILEVAMENTO TASTIERA ISTANTANEO (FOCUS NATIVO IOS)
  useEffect(() => {
    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      // Piccolo ritardo per evitare sfarfallii passando da un input all'altro
      setTimeout(() => setIsKeyboardOpen(false), 50);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => {
    async function fetchActiveEvent() {
      try {
        const today = new Date().toISOString().split('T')[0];

        let { data: event } = await supabase
          .from('events')
          .select('id')
          .lte('data_inizio', today)
          .gte('data_fine', today)
          .maybeSingle();

        if (!event) {
          const { data: upcoming } = await supabase
            .from('events')
            .select('id')
            .gte('data_inizio', today)
            .order('data_inizio', { ascending: true })
            .limit(1)
            .maybeSingle();
          event = upcoming;
        }

        if (!event) {
          const { data: lastEvent } = await supabase
            .from('events')
            .select('id')
            .order('data_inizio', { ascending: false })
            .limit(1)
            .maybeSingle();
          event = lastEvent;
        }

        if (event) {
          setActiveEventId(event.id);
        }
      } catch (err) {
        console.error('Errore fetch evento per BottomNav:', err);
      } finally {
        setLoadingEvent(false);
      }
    }

    fetchActiveEvent();
  }, []);

  const handleEventClick = () => {
    if (activeEventId) {
      router.push(`/events/${activeEventId}`);
    } else {
      router.push('/');
    }
  };

  const isEventActive = pathname.startsWith('/events');
  const isMascotteActive = pathname.startsWith('/mascotte');
  const ICON_SIZE = 42;

  // 🛑 SMONTAGGIO IMMEDIATO: Evita che Safari la spari sopra la tastiera
  if (isKeyboardOpen) return null;

  return (
    // 💡 NON È PIÙ FIXED. È un normale flex-item in fondo al layout.
    <nav className="w-full shrink-0 relative z-50 transform-gpu">
      <div 
        className="w-full bg-[#ebdec8]/95 backdrop-blur-xl border-t border-x border-white/60 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pt-1.5"
        style={{
          // Aggiunge la safe-area SOLO in basso su iPhone
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="flex items-center justify-around w-full px-1">
          {/* 1. HOME */}
          <button
            onClick={() => router.push('/')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl active:scale-90 shrink-0 ${
              pathname === '/'
                ? 'bg-[#1b2b25] text-[#ebdec8]'
                : 'text-[#1b2b25]/80 hover:text-[#1b2b25]'
            }`}
          >
            <CustomIcon name="tenda-grossa" size={ICON_SIZE} />
            <span className="text-[9px] font-black uppercase tracking-tight">Home</span>
          </button>

          {/* 2. CAMPO */}
          <button
            onClick={handleEventClick}
            disabled={loadingEvent}
            className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl active:scale-90 shrink-0 ${
              isEventActive
                ? 'bg-[#1b2b25] text-[#ebdec8]'
                : 'text-[#1b2b25]/80 hover:text-[#1b2b25]'
            }`}
          >
            <div className="w-[42px] h-[42px] flex items-center justify-center relative">
              <img src="/icons/fuoco.png" alt="Campo Fuoco" className="w-full h-full object-contain drop-shadow-xs" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight">Campo</span>
            {activeEventId && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-white" />
            )}
          </button>

          {/* 3. MASCOTTE */}
          <button
            onClick={() => router.push('/mascotte')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl active:scale-90 shrink-0 ${
              isMascotteActive
                ? 'bg-[#1b2b25] text-[#ebdec8]'
                : 'text-[#1b2b25]/80 hover:text-[#1b2b25]'
            }`}
          >
            <div className="w-[42px] h-[42px] flex items-center justify-center">
              <img src="/icons/lacavia.png" alt="La cavia" className="w-full h-full object-contain drop-shadow-xs" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight">La cavia</span>
          </button>

          {/* 4. STORICO */}
          <button
            onClick={() => router.push('/history')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl active:scale-90 shrink-0 ${
              pathname === '/history'
                ? 'bg-[#1b2b25] text-[#ebdec8]'
                : 'text-[#1b2b25]/80 hover:text-[#1b2b25]'
            }`}
          >
            <CustomIcon name="libro" size={ICON_SIZE} />
            <span className="text-[9px] font-black uppercase tracking-tight">Storico</span>
          </button>

          {/* 5. CURIOSITÀ */}
          <button
            onClick={() => router.push('/curiosita')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl active:scale-90 shrink-0 ${
              pathname === '/curiosita'
                ? 'bg-[#1b2b25] text-[#ebdec8]'
                : 'text-[#1b2b25]/80 hover:text-[#1b2b25]'
            }`}
          >
            <CustomIcon name="lampadina" size={ICON_SIZE} />
            <span className="text-[9px] font-black uppercase tracking-tight">Curiosità</span>
          </button>

          {/* 6. PROFILO */}
          <button
            onClick={() => router.push('/profile')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl active:scale-90 shrink-0 ${
              pathname === '/profile'
                ? 'bg-[#1b2b25] text-[#ebdec8]'
                : 'text-[#1b2b25]/80 hover:text-[#1b2b25]'
            }`}
          >
            <CustomIcon name="profilo" size={ICON_SIZE} />
            <span className="text-[9px] font-black uppercase tracking-tight">Io</span>
          </button>
        </div>
      </div>
    </nav>
  );
}