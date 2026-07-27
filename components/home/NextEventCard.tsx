"use client";

import Link from "next/link";
import CustomIcon from "@/components/ui/CustomIcon";

interface NextEventCardProps {
  event: any;
  daysLeft: number | null;
}

export default function NextEventCard({
  event,
  daysLeft,
}: NextEventCardProps) {
  if (!event) return null;

  // Badge partecipazione in stile timbro
  const getParticipationBadge = (status: string) => {
    switch (status) {
      case "partecipo":
        return {
          label: "CI SARÒ!",
          bg: "bg-[#486e61] text-[#ebdec8]",
        };
      case "forse":
        return {
          label: "IN FORSE",
          bg: "bg-[#d97706] text-white",
        };
      default:
        return {
          label: "NON CI SARÒ",
          bg: "bg-[#b91c1c] text-white",
        };
    }
  };

  const statusInfo = event.participation
    ? getParticipationBadge(event.participation)
    : null;

  return (
    <Link href={`/events/${event.id}`} className="block group">
      {/* Container Ticket / Pass */}
      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-200 active:scale-[0.98]">
        
        {/* --- CORPO DEL PASS (Spazio inferiore ridotto con pb-3) --- */}
        <div className="bg-[#ebdec8] p-6 pb-3 text-[#1b2b25]">
          
          {/* Header con Badge Fuoco (Sfondo a dimensione fissa, Fuoco più grande e svincolato) */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-2 bg-[#1b2b25]/10 px-3 h-7 rounded-full">
              <CustomIcon name="fuoco" size={60} className="-my-2 shrink-0 drop-shadow-sm" />
              <span className="text-xs font-black uppercase tracking-wider text-[#1b2b25]">
                MONTI SI AVVICINA
              </span>
            </div>

            {statusInfo && (
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md shadow-sm ${statusInfo.bg}`}
              >
                {statusInfo.label}
              </span>
            )}
          </div>

          {/* Titolo "Prossimo campo" e Tenda Gigante (Senza ingrandire il blocco del testo) */}
          <div className="flex items-center justify-between gap-4 my-2">
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1b2b25]/60">
                Prossimo campo
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1b2b25] leading-tight truncate">
                {event.titolo}
              </h2>
            </div>
            <CustomIcon name="tenda" size={100} className="shrink-0 drop-shadow-sm -my-8" />
          </div>

          {/* Dettagli Luogo e Data (Spaziatura ridotta) */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2.5 pt-2 border-t border-[#1b2b25]/15">
            {event.luogo && (
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#1b2b25]">
                <CustomIcon name="pin" size={22} className="shrink-0" />
                <span>{event.luogo}</span>
              </div>
            )}
            {(event.data_inizio || event.data_evento) && (
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#1b2b25]">
                <CustomIcon name="calendar" size={22} className="shrink-0" />
                <span>{event.data_inizio || event.data_evento}</span>
              </div>
            )}
          </div>
        </div>

        {/* --- LINEA SEPARATRICE PERFORATA --- */}
        <div className="relative bg-[#ebdec8] h-4 flex items-center justify-between overflow-hidden">
          <div className="w-6 h-6 bg-[#1b2b25] rounded-full -ml-3 shrink-0" />
          <div className="w-full border-b-2 border-dashed border-[#1b2b25]/30 mx-2" />
          <div className="w-6 h-6 bg-[#1b2b25] rounded-full -mr-3 shrink-0" />
        </div>

        {/* --- MATRICE / STUB DEL BIGLIETTO --- */}
        <div className="bg-[#6c9a8b] px-6 py-4 text-[#ebdec8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {daysLeft !== null && (
              <span className="text-4xl font-black text-[#ebdec8] leading-none">
                {daysLeft}
              </span>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-[#ebdec8]">
                {daysLeft === 1 ? "Giorno mancante" : "Giorni mancanti"}
              </span>
              <span className="text-[10px] text-[#ebdec8]/80 font-medium">
                Tocca per aprire i dettagli
              </span>
            </div>
          </div>

          <div className="bg-[#ebdec8] text-[#1b2b25] px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md">
            Vedi →
          </div>
        </div>

      </div>
    </Link>
  );
}