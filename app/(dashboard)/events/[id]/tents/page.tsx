"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
import CustomIcon from "@/components/ui/CustomIcon";

interface Tent {
  id: string;
  nome: string;
  marca?: string;
  modello?: string;
  posti: number;
  foto?: string;
  note?: string;
}

interface EventTentItem {
  id: string; // ID di event_tents
  event_id: string;
  tent_id: string;
  tent: Tent | null;
  membersCount: number;
}

export default function TentsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [tents, setTents] = useState<EventTentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚡ CARICAMENTO PARALLELO BATCHED (ZERO WATERFALL)
  async function loadTents() {
    setLoading(true);

    try {
      // 1. Recupera la lista delle tende dell'evento
      const { data: eventTents, error: eventTentsErr } = await supabase
        .from("event_tents")
        .select("*")
        .eq("event_id", id);

      if (eventTentsErr) {
        console.error("Errore event_tents:", eventTentsErr);
        setTents([]);
        setLoading(false);
        return;
      }

      if (!eventTents || eventTents.length === 0) {
        setTents([]);
        setLoading(false);
        return;
      }

      // Estrai gli ID per fare query in BATCH
      const tentIds = Array.from(
        new Set(eventTents.map((et) => et.tent_id).filter(Boolean))
      );
      const eventTentIds = eventTents.map((et) => et.id).filter(Boolean);

      // 2. Esegui in parallelo il recupero dettagli tende e il conteggio membri
      const [tentsRes, membersRes] = await Promise.all([
        tentIds.length > 0
          ? supabase.from("tents").select("*").in("id", tentIds)
          : { data: [] },
        eventTentIds.length > 0
          ? supabase
              .from("tent_members")
              .select("id, event_tent_id")
              .in("event_tent_id", eventTentIds)
          : { data: [] },
      ]);

      // Mappa per Dettagli Tende
      const tentsMap = new Map(
        (tentsRes.data || []).map((t: Tent) => [t.id, t])
      );

      // Mappa per Conteggio Membri per ogni Tenda dell'Evento
      const membersCountMap = new Map<string, number>();
      (membersRes.data || []).forEach((m) => {
        const count = membersCountMap.get(m.event_tent_id) || 0;
        membersCountMap.set(m.event_tent_id, count + 1);
      });

      // Format dei dati finali
      const formatted: EventTentItem[] = eventTents.map((et) => ({
        ...et,
        tent: tentsMap.get(et.tent_id) || null,
        membersCount: membersCountMap.get(et.id) || 0,
      }));

      setTents(formatted);
    } catch (err) {
      console.error("ERRORE CARICAMENTO TENDE:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadTents();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Caricamento tende in corso...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto text-zinc-100">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton label="Evento" />
      </div>

      {/* Header Titolo */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
            <CustomIcon name="tenda-grossa" size={48} />
            <span>Tende Evento</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Gestisci la disposizione degli alloggi per i partecipanti.
          </p>
        </div>
      </div>

      {/* Bottone Aggiungi Tenda */}
      <button
        onClick={() => router.push(`/events/${id}/tents/add`)}
        className="w-full py-4 px-5 mb-8 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span className="text-xl">➕</span>
        <span className="text-[15px]">Aggiungi una Tenda all'Evento</span>
      </button>

      {/* Stato Vuoto */}
      {tents.length === 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-10 text-center backdrop-blur-md">
          <div className="w-24 h-24 mx-auto mb-4 rounded-[2rem] bg-amber-500/10 flex items-center justify-center">
            <CustomIcon name="tenda-grossa" size={64} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Nessuna tenda presente
          </h3>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            Non è stata ancora aggiunta alcuna tenda per questo evento.
          </p>
        </div>
      )}

      {/* Lista Tende */}
      <div className="flex flex-col gap-5">
        {tents.map((item) => (
          <TentCard
            key={item.id}
            item={item}
            eventId={id}
            router={router}
          />
        ))}
      </div>
    </main>
  );
}

// 🎪 COMPONENTE TENT CARD
function TentCard({
  item,
  eventId,
  router,
}: {
  item: EventTentItem;
  eventId: string;
  router: any;
}) {
  const [open, setOpen] = useState(false);
  const tent = item.tent;

  if (!tent) return null;

  const posti = tent.posti || 0;
  const occupati = item.membersCount || 0;
  const liberi = posti - occupati;
  const isFull = liberi <= 0;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-5 backdrop-blur-xl transition-all shadow-xl">
      {/* Header Card (Cliccabile) */}
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer select-none"
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            <div className="flex items-center gap-3">
              <CustomIcon name="tenda-grossa" size={40} />
              <h2 className="text-2xl font-bold text-white">{tent.nome}</h2>
            </div>

            {(tent.marca || tent.modello) && (
              <p className="text-xs text-zinc-400 mt-2">
                {tent.marca} {tent.modello}
              </p>
            )}
          </div>

          {/* Badge Stato */}
          <div className="flex flex-col items-end gap-2 mt-1">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                isFull
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {isFull ? "COMPLETA 🔴" : `${liberi} liberi 🟢`}
            </span>
            <span className="text-zinc-500 text-sm font-bold mr-2 mt-1">
              {open ? "▲" : "▼"}
            </span>
          </div>
        </div>

        {/* Visualizzatore Posti a Grafico */}
        <div className="mt-5 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-mono">
            <span className="font-medium">Occupazione Tenda</span>
            <span className="font-bold text-zinc-300">
              {occupati} / {posti} Posti
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: occupati }).map((_, i) => (
              <div
                key={`occ-${i}`}
                title="Posto Occupato"
                className="flex-1 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"
              />
            ))}
            {Array.from({ length: Math.max(0, liberi) }).map((_, i) => (
              <div
                key={`lib-${i}`}
                title="Posto Libero"
                className="flex-1 h-3 rounded-full bg-zinc-800 border border-zinc-700/50"
              />
            ))}
          </div>
        </div>

        {/* Foto Tenda (se disponibile) */}
        {tent.foto && (
          <div className="mt-4 h-44 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
            <img
              src={tent.foto}
              alt={tent.nome}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Dettagli Espandibili */}
      {open && (
        <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">🛏️ Posti liberi rimanenti:</span>
            <span className="font-bold text-white">{liberi}</span>
          </div>

          {tent.note && (
            <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/60 text-xs text-zinc-300 mt-2">
              <span className="font-semibold text-amber-400 block mb-1">
                📝 Note Tenda:
              </span>
              <span className="leading-relaxed">{tent.note}</span>
            </div>
          )}

          <button
            onClick={() => router.push(`/events/${eventId}/tents/${item.id}`)}
            className="mt-4 w-full py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-zinc-700/50"
          >
            <span>⚙️</span>
            <span>Gestisci Equipaggio Tenda</span>
          </button>
        </div>
      )}
    </div>
  );
}