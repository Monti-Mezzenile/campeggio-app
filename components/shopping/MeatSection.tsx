"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MeatSection({
  eventId,
  user,
  callData,
  takeCarne,
  answerCarne,
  cancelCarne,
}: {
  eventId: string;
  user: any;
  callData: any;
  takeCarne: () => void;
  answerCarne: (value: boolean) => void;
  cancelCarne: () => void;
}) {
  const [meatItems, setMeatItems] = useState<any[]>([]);
  const [newMeat, setNewMeat] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMeat() {
    setLoading(true);
    const { data, error } = await supabase
      .from("meat_items")
      .select(`
        *,
        meat_votes(
          user_id,
          profiles:user_id(
            nome
          )
        )
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) console.log("ERRORE CARICAMENTO CARNE:", error);
    setMeatItems(data || []);
    setLoading(false);
  }

  async function addMeat() {
    if (!newMeat.trim()) return;
    const { error } = await supabase
      .from("meat_items")
      .insert({ event_id: eventId, nome: newMeat.trim() });

    if (error) {
      alert(error.message);
      return;
    }
    setNewMeat("");
    loadMeat();
  }

  async function deleteMeat(meat: any) {
    const confirmDelete = window.confirm(`Eliminare "${meat.nome}"?`);
    if (!confirmDelete) return;

    const { error: votesError } = await supabase
      .from("meat_votes")
      .delete()
      .eq("meat_item_id", meat.id);

    if (votesError) {
      alert(votesError.message);
      return;
    }

    const { error } = await supabase
      .from("meat_items")
      .delete()
      .eq("id", meat.id);

    if (error) {
      alert(error.message);
      return;
    }
    loadMeat();
  }

  async function toggleVote(meat: any) {
    if (!user) return;
    const alreadyVoted = meat.meat_votes?.some(
      (vote: any) => vote.user_id === user.id
    );

    if (alreadyVoted) {
      const { error } = await supabase
        .from("meat_votes")
        .delete()
        .eq("meat_item_id", meat.id)
        .eq("user_id", user.id);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("meat_votes")
        .insert({ meat_item_id: meat.id, user_id: user.id });

      if (error) {
        alert(error.message);
        return;
      }
    }
    loadMeat();
  }

  useEffect(() => {
    if (eventId) loadMeat();
  }, [eventId]);

  return (
    <div className="flex flex-col gap-4">
      {/* 🥩 1. CHI PRENOTA CARNE */}
      <div className="bg-white/90 backdrop-blur-md border border-white rounded-2xl p-4 shadow-sm space-y-2.5">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#1b2b25]/70 flex items-center gap-1.5">
          <span>🥩</span> Responsabile Macelleria
        </h2>

        {!callData ? (
          <button
            onClick={takeCarne}
            className="w-full bg-[#1b2b25] text-white rounded-xl py-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wide active:scale-98 transition shadow-sm"
          >
            🥩 Chiamo io per la carne!
          </button>
        ) : !callData.prenotato ? (
          <div className="space-y-2.5">
            <p className="text-sm font-bold text-[#1b2b25]">
              👤 <span className="font-black underline">{callData.profiles?.nome}</span>, hai già ordinato?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => answerCarne(true)}
                className="flex-1 bg-emerald-700 text-white rounded-xl py-2.5 text-xs sm:text-sm font-black uppercase tracking-wide active:scale-95 transition shadow-xs"
              >
                Sì, ordinato!
              </button>
              <button
                onClick={() => answerCarne(false)}
                className="flex-1 bg-white text-[#1b2b25] border border-slate-200 rounded-xl py-2.5 text-xs sm:text-sm font-black uppercase tracking-wide active:scale-95 transition"
              >
                No / Annulla
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <p className="text-xs sm:text-sm font-bold text-emerald-900">
              ✅ <span className="font-black">{callData.profiles?.nome}</span> ha prenotato la carne!
            </p>
            <button
              onClick={cancelCarne}
              className="text-red-500 hover:text-red-700 text-sm font-black px-2 py-1 active:scale-90 transition"
              title="Annulla incarico"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 🗳️ 2. VOTAZIONE CARNE */}
      <div className="bg-white/90 backdrop-blur-md border border-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#1b2b25]/70 flex items-center gap-1.5">
          <span>🗳️</span> Proposte & Voti
        </h2>

        {/* Form Aggiunta */}
        <div className="flex gap-2">
          <input
            value={newMeat}
            onChange={(e) => setNewMeat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMeat()}
            placeholder="Aggiungi tipo di carne..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#1b2b25] placeholder-[#1b2b25]/40 focus:outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-xs"
          />
          <button
            onClick={addMeat}
            className="bg-[#1b2b25] text-white px-4 py-2.5 rounded-xl text-sm font-black active:scale-95 transition shadow-xs shrink-0"
          >
            + Aggiungi
          </button>
        </div>

        {/* Lista Proposte */}
        {loading ? (
          <p className="text-xs font-bold text-[#1b2b25]/50 py-3 text-center">
            Caricamento proposte...
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-0.5">
            {meatItems.length === 0 ? (
              <p className="text-xs font-medium text-[#1b2b25]/50 text-center py-4 italic">
                Nessuna proposta inserita al momento
              </p>
            ) : (
              meatItems.map((meat) => {
                const myVote = meat.meat_votes?.some(
                  (vote: any) => vote.user_id === user?.id
                );
                return (
                  <div
                    key={meat.id}
                    className={`border rounded-xl p-3 transition flex flex-col gap-2 ${
                      myVote
                        ? "bg-emerald-50/80 border-emerald-300 shadow-2xs"
                        : "bg-white border-slate-200/80 shadow-2xs"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <button
                        onClick={() => toggleVote(meat)}
                        className="flex-1 text-left flex items-center justify-between gap-2 min-w-0"
                      >
                        <span className="text-sm font-black text-[#1b2b25] truncate">
                          🥩 {meat.nome}
                        </span>
                        <span className="text-xs font-black bg-[#1b2b25]/10 text-[#1b2b25] px-2 py-0.5 rounded-full shrink-0">
                          👥 {meat.meat_votes?.length || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => deleteMeat(meat)}
                        className="text-slate-400 hover:text-red-500 text-sm p-1 font-bold shrink-0 active:scale-90 transition"
                        title="Elimina voce"
                      >
                        ✕
                      </button>
                    </div>

                    {meat.meat_votes?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                        {meat.meat_votes.map((vote: any) => (
                          <span
                            key={vote.user_id}
                            className="text-[11px] font-bold bg-white/90 border border-slate-200 text-[#1b2b25] px-2 py-0.5 rounded-md shadow-2xs"
                          >
                            ✓ {vote.profiles?.nome || "Utente"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}