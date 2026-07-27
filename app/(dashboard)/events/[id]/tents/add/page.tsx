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

interface UserTent extends Tent {
  isAlreadyAdded?: boolean;
}

export default function AddTentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // event_id

  const [tents, setTents] = useState<UserTent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      // ⚡ Recupero in parallelo delle tende personali e delle tende già presenti nell'evento
      const [userTentsRes, eventTentsRes] = await Promise.all([
        supabase
          .from("tents")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("event_tents")
          .select("tent_id")
          .eq("event_id", id),
      ]);

      if (userTentsRes.error) {
        console.error("Errore recupero tende:", userTentsRes.error);
      }

      // Set degli ID tende già associate a questo evento
      const existingTentIds = new Set(
        (eventTentsRes.data || []).map((et) => et.tent_id)
      );

      // Formattazione con flag isAlreadyAdded
      const formattedTents: UserTent[] = (userTentsRes.data || []).map(
        (tent: Tent) => ({
          ...tent,
          isAlreadyAdded: existingTentIds.has(tent.id),
        })
      );

      setTents(formattedTents);
    } catch (err) {
      console.error("Errore durante il caricamento:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addTent(tentId: string) {
    if (addingId) return;

    setAddingId(tentId);

    try {
      // Inserimento tenda nell'evento
      const { error } = await supabase.from("event_tents").insert({
        event_id: id,
        tent_id: tentId,
      });

      if (error) {
        console.error("Errore aggiunta tenda:", error);
        alert(error.message);
        setAddingId(null);
        return;
      }

      router.push(`/events/${id}/tents`);
    } catch (err) {
      console.error("Errore inatteso:", err);
      setAddingId(null);
    }
  }

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Caricamento le tue tende...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto text-zinc-100">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton label="Tende Evento" />
      </div>

      {/* Header Titolo */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
          <CustomIcon name="tenda-grossa" size={48} />
          <span>Le Tue Tende</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Scegli una delle tue tende personali da mettere a disposizione per questo evento.
        </p>
      </div>

      {/* Stato Vuoto */}
      {tents.length === 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-10 text-center backdrop-blur-md">
          <div className="w-24 h-24 mx-auto mb-4 rounded-[2rem] bg-amber-500/10 flex items-center justify-center">
            <CustomIcon name="tenda-grossa" size={64} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Non hai ancora tende registrate
          </h3>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto mb-6">
            Aggiungi prima le tue tende nel tuo profilo per poterle assegnare a questo evento.
          </p>
          <button
            onClick={() => router.push("/profile/tents/new")}
            className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/15 active:scale-[0.98] transition-all"
          >
            ➕ Crea nuova tenda
          </button>
        </div>
      )}

      {/* Lista Tende Selezionabili */}
      <div className="flex flex-col gap-5">
        {tents.map((tent) => {
          const isAddingThis = addingId === tent.id;

          return (
            <div
              key={tent.id}
              className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 backdrop-blur-xl transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Header Card con Icona e Nome */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CustomIcon name="tenda-grossa" size={40} />
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {tent.nome}
                      </h2>
                      {(tent.marca || tent.modello) && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {tent.marca} {tent.modello}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badge se già aggiunta */}
                  {tent.isAlreadyAdded && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      Già nell'evento
                    </span>
                  )}
                </div>

                {/* Foto Tenda se presente */}
                {tent.foto && (
                  <div className="mt-4 h-48 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                    <img
                      src={tent.foto}
                      alt={tent.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Specifiche Posti */}
                <div className="mt-4 flex items-center gap-4 text-sm text-zinc-300 font-medium">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                    <span>🛏️</span>
                    <span>
                      <strong className="text-white">{tent.posti}</strong> Posti Letto
                    </span>
                  </div>
                </div>

                {/* Note Tenda */}
                {tent.note && (
                  <div className="mt-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/60 text-xs text-zinc-300">
                    <span className="font-semibold text-amber-400 block mb-1">
                      📝 Note:
                    </span>
                    <span className="leading-relaxed">{tent.note}</span>
                  </div>
                )}
              </div>

              {/* Pulsante Azione */}
              <button
                disabled={Boolean(addingId) || tent.isAlreadyAdded}
                onClick={() => addTent(tent.id)}
                className={`mt-5 w-full py-4 px-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  tent.isAlreadyAdded
                    ? "bg-zinc-800/50 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/15 active:scale-[0.98] disabled:opacity-50"
                }`}
              >
                {isAddingThis ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                    <span>Aggiunta in corso...</span>
                  </>
                ) : tent.isAlreadyAdded ? (
                  <span>Tenda già aggiunta a questo evento</span>
                ) : (
                  <>
                    <span>➕</span>
                    <span>Porta Questa Tenda</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}