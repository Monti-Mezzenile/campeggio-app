"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ProfileTentsPage() {
  const router = useRouter();

  const [tents, setTents] = useState<Tent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadTents() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("ERRORE CARICAMENTO TENDE:", error);
      }

      setTents(data || []);
    } catch (err) {
      console.error("Errore inatteso:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTent(id: string) {
    const confirmDelete = confirm(
      "Sei sicuro di voler eliminare definitivamente questa tenda dal tuo profilo?"
    );

    if (!confirmDelete) return;

    setDeletingId(id);

    try {
      const { error } = await supabase.from("tents").delete().eq("id", id);

      if (error) {
        console.error("ERRORE ELIMINAZIONE TENDA:", error);
        alert(error.message);
        setDeletingId(null);
        return;
      }

      setTents((prev) => prev.filter((tent) => tent.id !== id));
    } catch (err) {
      console.error("Errore inatteso eliminazione:", err);
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadTents();
  }, []);

  // Calcolo totale posti letto
  const totalBeds = tents.reduce((acc, t) => acc + (Number(t.posti) || 0), 0);

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-3xl mx-auto flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-zinc-800 tracking-wide">
          Apertura garage tende...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-3xl mx-auto text-zinc-900">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton label="Profilo" />
      </div>

      {/* Header Stile "Equipment Garage" */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/10 border border-amber-900/20 text-amber-950 text-[11px] font-black uppercase tracking-wider mb-1.5 backdrop-blur-md">
            <span>⛺ Camping Equipment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
            Le Mie Tende
          </h1>
          {tents.length > 0 && (
            <p className="text-xs font-bold text-zinc-700 mt-1 flex items-center gap-2">
              <span>{tents.length} {tents.length === 1 ? "tenda registrata" : "tende registrate"}</span>
              <span>•</span>
              <span className="text-amber-800 font-extrabold">{totalBeds} posti letto totali 🛏️</span>
            </p>
          )}
        </div>

        <button
          onClick={() => router.push("/profile/tents/new")}
          className="h-12 w-12 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 font-black text-2xl shadow-lg shadow-amber-500/20 active:scale-90 transition-all flex items-center justify-center shrink-0 border border-amber-500/30"
          title="Aggiungi tenda"
        >
          +
        </button>
      </div>

      {/* Stato Vuoto (Chiaro) */}
      {tents.length === 0 && (
        <div className="bg-white/80 border border-white/80 rounded-3xl p-8 text-center text-zinc-900 shadow-lg backdrop-blur-md">
          <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <CustomIcon name="tenda-grossa" size={52} />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">
            Garage Vuoto
          </h3>
          <p className="text-xs text-zinc-600 max-w-xs mx-auto mb-5">
            Non hai ancora registrato tende personali. Aggiungine una per poterla assegnare facilmente ai prossimi eventi!
          </p>
          <button
            onClick={() => router.push("/profile/tents/new")}
            className="py-2.5 px-5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            Aggiungi la tua prima tenda
          </button>
        </div>
      )}

      {/* Grid a 2 Colonne FISSE con Card Chiare (Light Glassmorphic) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {tents.map((tent) => {
          const isDeleting = deletingId === tent.id;

          return (
            <div
              key={tent.id}
              className="bg-white/80 border border-white/90 rounded-2xl p-3 backdrop-blur-md flex flex-col justify-between shadow-md text-zinc-900 hover:shadow-lg transition-all"
            >
              <div>
                {/* Foto Tenda o Icona Fallback */}
                {tent.foto ? (
                  <div className="w-full h-28 sm:h-36 rounded-xl overflow-hidden bg-white border border-amber-900/10 p-1 mb-2.5 flex items-center justify-center relative shadow-sm">
                    <img
                      src={tent.foto}
                      alt={tent.nome}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-24 sm:h-32 rounded-xl bg-amber-50/50 border border-amber-200/60 mb-2.5 flex items-center justify-center">
                    <CustomIcon name="tenda-grossa" size={40} />
                  </div>
                )}

                {/* Titolo e Marca */}
                <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 truncate leading-tight flex items-center gap-1.5">
                  <span>{tent.nome}</span>
                </h2>
                {(tent.marca || tent.modello) && (
                  <p className="text-[11px] text-zinc-600 truncate mt-0.5 font-medium">
                    {tent.marca} {tent.modello}
                  </p>
                )}

                {/* Badge Posti Letto */}
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-950">
                    🛏️ {tent.posti} posti
                  </span>
                </div>

                {/* Note se presenti */}
                {tent.note && (
                  <p className="text-[10px] text-zinc-700 mt-2 line-clamp-2 italic bg-amber-950/5 p-1.5 rounded-lg border border-amber-950/10">
                    "{tent.note}"
                  </p>
                )}
              </div>

              {/* Pulsanti Azione */}
              <div className="flex gap-1.5 mt-3 pt-2 border-t border-zinc-900/10">
                <button
                  onClick={() => router.push(`/profile/tents/${tent.id}`)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1"
                >
                  <span>✏️</span>
                  <span>Modifica</span>
                </button>

                <button
                  onClick={() => deleteTent(tent.id)}
                  disabled={isDeleting}
                  className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-medium text-[11px] sm:text-xs border border-rose-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  title="Elimina tenda"
                >
                  {isDeleting ? "..." : "🗑️"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}