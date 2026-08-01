"use client";

import Link from "next/link";
import CustomIcon, { IconName } from "@/components/ui/CustomIcon";

interface EventItem {
  id: string | number;
  titolo: string;
  luogo: string;
  data_inizio?: string;
  data_evento?: string;
  data_fine?: string;
  [key: string]: any;
}

interface MyEventsProps {
  events: EventItem[];
  isAdmin: boolean;
}

// 🎯 Helper per formattare la data nel formato "LUGLIO 2020" / "AGOSTO 2026"
function formatMonthYear(dateStr?: string) {
  if (!dateStr) return "DATA TBD";

  const cleanStr = dateStr.split("T")[0];
  const parts = cleanStr.split("-").map(Number);

  if (parts.length < 3 || parts.some(isNaN)) return dateStr;

  const date = new Date(parts[0], parts[1] - 1, parts[2]);

  return date
    .toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

// 🎯 Helper per parse locale senza problemi di fuso orario
function parseLocalDate(dateStr?: string) {
  if (!dateStr) return null;
  const cleanStr = dateStr.split("T")[0];
  const parts = cleanStr.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return new Date(dateStr);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export default function MyEvents({ events, isAdmin }: MyEventsProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // 🎯 Trova dinamicamente il VERO prossimo evento (o in corso)
  const nextEventItem = events.find((event) => {
    const startDateStr = event.data_inizio || event.data_evento;
    const endDateStr = event.data_fine || startDateStr;
    if (!startDateStr) return false;

    const start = parseLocalDate(startDateStr);
    const end = parseLocalDate(endDateStr);
    if (!start) return false;

    const checkEnd = end || start;
    checkEnd.setHours(23, 59, 59, 999);

    return checkEnd >= now;
  });

  const nextEventId = nextEventItem?.id;

  return (
    <section className="mt-7">
      {/* Header della sezione */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#ebdec8]">
            I MIEI EVENTI
          </h2>
          {events.length > 0 && (
            <span className="text-[10px] font-mono font-bold bg-[#ebdec8]/15 text-[#ebdec8] px-2 py-0.5 rounded-full border border-[#ebdec8]/20">
              {events.length}
            </span>
          )}
        </div>

        {isAdmin && (
          <Link
            href="/events/new"
            className="flex items-center gap-1 bg-[#ebdec8] text-[#1b2b25] px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#ebdec8]/90 active:scale-95 transition-all shadow-xs"
          >
            <span>+ CREA</span>
          </Link>
        )}
      </div>

      {/* Contenuto principale */}
      {events.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-6 bg-[#ebdec8]/5 border border-dashed border-[#ebdec8]/25 rounded-3xl text-center">
          <div className="mb-2 opacity-80">
            <CustomIcon name="tenda-grossa" size={48} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#ebdec8] mt-1">
            Nessuna spedizione
          </h3>
          <p className="text-[11px] text-[#ebdec8]/60 mt-1 max-w-[220px]">
            {isAdmin
              ? "Pianifica il prossimo campeggio con la ciurma!"
              : "Non ci sono ancora campeggi attivi."}
          </p>
          {isAdmin && (
            <Link
              href="/events/new"
              className="mt-3.5 text-[10px] font-black uppercase tracking-wider bg-[#ebdec8] text-[#1b2b25] px-4 py-1.5 rounded-xl active:scale-95 transition-all shadow-sm"
            >
              + Nuovo Campeggio
            </Link>
          )}
        </div>
      ) : (
        /* Carousel delle Schede Evento (FIX: py-2.5 permette al ring-offset di non venire tagliato) */
        <div className="flex gap-3 overflow-x-auto py-2.5 scrollbar-hide snap-x snap-mandatory -mx-6 px-6">
          {events.map((event, index) => {
            const rawDate = event.data_inizio || event.data_evento;
            const formattedDate = formatMonthYear(rawDate);

            // Verifico se questo specifico evento è quello imminente
            const isNext = event.id === nextEventId;

            // Rilevamento automatico stagione invernale
            const isWinter =
              event.titolo?.toLowerCase().includes("winter") ||
              event.luogo?.toLowerCase().includes("winter");

            const bgIconName: IconName = isWinter ? "snow" : "fuoco";

            // Palette di colori: Blu Notte per Inverno, Bordeaux per Estate/Standard
            const cardBgStyles = isWinter
              ? "bg-[#182b3a] border-sky-400/30 text-sky-50 shadow-sky-950/40"
              : "bg-[#a63a50] border-white/20 text-white shadow-black/20";

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="min-w-[245px] max-w-[265px] snap-start shrink-0 group"
              >
                <div
                  className={`relative h-[135px] rounded-3xl p-4 overflow-hidden shadow-md border transition-all duration-200 active:scale-[0.98] flex flex-col justify-between ${cardBgStyles} ${
                    isNext
                      ? "ring-2 ring-[#ebdec8] ring-offset-2 ring-offset-[#0d1b1e]"
                      : ""
                  }`}
                >
                  {/* Filigrana Icona in Background */}
                  <div className="absolute -right-3 -bottom-3 opacity-30 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <CustomIcon name={bgIconName} size={100} />
                  </div>

                  {/* Top Bar della Card */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5">
                      {isNext ? (
                        <span className="text-[9px] font-mono font-black tracking-widest px-2 py-0.5 rounded-md uppercase bg-[#ebdec8] text-[#1b2b25] shadow-xs">
                          PROSSIMO
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-black tracking-widest px-2 py-0.5 rounded-md uppercase bg-black/25 text-[#ebdec8]">
                          CAMP #{index + 1}
                        </span>
                      )}

                      {/* Badge Neve Aggiuntivo se Winter */}
                      {isWinter && (
                        <span className="bg-sky-400/20 text-sky-200 border border-sky-300/40 text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <CustomIcon name="snow" size={10} /> WINTER
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-black opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                      ↗
                    </span>
                  </div>

                  {/* Informazioni Evento */}
                  <div className="z-10 mt-1">
                    <h3 className="font-black text-sm uppercase tracking-wide leading-snug truncate pr-2">
                      {event.titolo}
                    </h3>

                    {/* Luogo & Data formattata (es. LUGLIO 2020) */}
                    <div className="mt-2 flex flex-col gap-0.5 text-[11px] opacity-90">
                      {event.luogo && (
                        <div className="flex items-center gap-1.5 truncate">
                          <CustomIcon name="pin" size={13} className="shrink-0" />
                          <span className="truncate font-semibold">
                            {event.luogo}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-tight">
                        <CustomIcon name="calendar" size={13} className="shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}