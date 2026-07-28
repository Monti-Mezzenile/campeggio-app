"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  
  // Stato per nascondere brutalmente la barra
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 1. Intercettazione ISTANTANEA della tastiera (senza visualViewport)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    // Usiamo focusin/focusout perché sono fulminei rispetto al resize
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Fetch dell'evento in corso o più prossimo
  useEffect(() => {
    async function fetchActiveEvent() {
      try {
        const today = new Date().toISOString().split("T")[0];

        let { data: event } = await supabase
          .from("events")
          .select("id")
          .lte("data_inizio", today)
          .gte("data_fine", today)
          .maybeSingle();

        if (!event) {
          const { data: upcoming } = await supabase
            .from("events")
            .select("id")
            .gte("data_inizio", today)
            .order("data_inizio", { ascending: true })
            .limit(1)
            .maybeSingle();

          event = upcoming;
        }

        if (!event) {
          const { data: lastEvent } = await supabase
            .from("events")
            .select("id")
            .order("data_inizio", { ascending: false })
            .limit(1)
            .maybeSingle();

          event = lastEvent;
        }

        if (event) {
          setActiveEventId(event.id);
        }
      } catch (err) {
        console.error("Errore fetch evento per BottomNav:", err);
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
      router.push("/");
    }
  };

  const isEventActive = pathname.startsWith("/events");
  const ICON_SIZE = 50;

  // Se la tastiera è aperta, NON renderizziamo proprio la UI per evitare conflitti con iOS
  if (isKeyboardOpen) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full pointer-events-none"
    >
      {/* 
        Rimossi transform-gpu e transizioni. 
        Aggiunto un calc() per il padding bottom così non si schiaccia mai contro il bordo.
      */}
      <div className="w-full bg-[#ebdec8]/95 backdrop-blur-xl border-t border-x border-white/60 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1.5 pointer-events-auto">
        <div className="flex items-center justify-around w-full px-2">
          
          {/* 1. HOME */}
          <button
            onClick={() => router.push("/")}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl active:scale-90 shrink-0 ${
              pathname === "/" ? "bg-[#1b2b25] text-[#ebdec8]" : "text-[#1b2b25]/80 hover:text-[#1b2b25]"
            }`}
          >
            <CustomIcon name="tenda-grossa" size={ICON_SIZE} />
            <span className="text-[9px] font-black uppercase tracking-tight">Home</span>
          </button>

          {/* 2. EVENTO CORRENTE */}
          <button
            onClick={handleEventClick}
            disabled={loadingEvent}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl active:scale-90 shrink-0 ${
              isEventActive ? "bg-[#1b2b25] text-[#ebdec8]" : "text-[#1b2b25]/80 hover:text-[#1b2b25]"
            }`}
          >
            <div className="w-[50px] h-[50px] flex items-center justify-center relative">
              <img
                src="/icons/fuoco.png"
                alt="Campo Fuoco"
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight">Campo</span>

            {activeEventId && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-white" />
            )}
          </button>

          {/* 3. STORICO */}
          <button
            onClick={() => router.push("/history")}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl active:scale-90 shrink-0 ${
              pathname === "/history" ? "bg-[#1b2b25] text-[#ebdec8]" : "text-[#1b2b25]/80 hover:text-[#1b2b25]"
            }`}
          >
            <CustomIcon name="libro" size={ICON_SIZE} />
            <span className="text-[9px] font-black uppercase tracking-tight">Storico</span>
          </button>

          {/* 4. CURIOSITÀ */}
          <button
            onClick={() => router.push("/curiosita")}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl active:scale-90 shrink-0 ${
              pathname === "/curiosita" ? "bg-[#1b2b25] text-[#ebdec8]" : "text-[#1b2b25]/80 hover:text-[#1b2b25]"
            }`}
          >
            <CustomIcon name="lampadina" size={ICON_SIZE} />
            <span className="text-[9px] font-black uppercase tracking-tight">Curiosità</span>
          </button>

          {/* 5. PROFILO (IO) */}
          <button
            onClick={() => router.push("/profile")}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl active:scale-90 shrink-0 ${
              pathname === "/profile" ? "bg-[#1b2b25] text-[#ebdec8]" : "text-[#1b2b25]/80 hover:text-[#1b2b25]"
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