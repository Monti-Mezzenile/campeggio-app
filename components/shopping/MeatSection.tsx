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
    <div className="flex flex-col gap-2.5">
      {/* CHI PRENOTA CARNE */}
      <div className="bg-white/80 backdrop-blur-md border border-white rounded-xl p-2.5 shadow-2xs">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/70 mb-1.5 flex items-center gap-1">
          <span>🥩</span> Responsabile Macelleria
        </h2>

        {!callData ? (
          <button
            onClick={takeCarne}
            className="w-full bg-[#1b2b25] text-white rounded-lg py-1.5 px-3 text-xs font-extrabold active:scale-98 transition shadow-2xs"
          >
            🥩 Chiamo io per la carne!
          </button>
        ) : !callData.prenotato ? (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[#1b2b25]">
              👤 <span className="underline">{callData.profiles?.nome}</span>, hai già ordinato?
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => answerCarne(true)}
                className="flex-1 bg-emerald-700 text-white rounded-lg py-1 text-xs font-extrabold active:scale-95 transition"
              >
                Sì, ordinato!
              </button>
              <button
                onClick={() => answerCarne(false)}
                className="flex-1 bg-white/80 text-[#1b2b25] border border-white rounded-lg py-1 text-xs font-extrabold active:scale-95 transition"
              >
                No / Annulla
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-emerald-50/80 border border-emerald-200 rounded-lg p-1.5 px-2">
            <p className="text-xs font-bold text-emerald-900">
              ✅ <span className="font-black">{callData.profiles?.nome}</span> ha prenotato la carne!
            </p>
            <button
              onClick={cancelCarne}
              className="text-red-500 text-xs font-black px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* VOTAZIONE CARNE */}
      <div className="bg-white/80 backdrop-blur-md border border-white rounded-xl p-2.5 shadow-2xs">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/70 mb-2 flex items-center gap-1">
          <span>🗳️</span> Proposte & Voti
        </h2>

        <div className="flex gap-1.5 mb-2">
          <input
            value={newMeat}
            onChange={(e) => setNewMeat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMeat()}
            placeholder="Aggiungi carne..."
            className="flex-1 bg-white border border-white rounded-lg px-2.5 py-1 text-xs text-[#1b2b25] placeholder-[#1b2b25]/40 focus:outline-hidden"
          />
          <button
            onClick={addMeat}
            className="bg-[#1b2b25] text-white px-3 py-1 rounded-lg text-xs font-extrabold active:scale-95 transition"
          >
            +
          </button>
        </div>

        {loading ? (
          <p className="text-[10px] font-bold text-[#1b2b25]/50 py-1 text-center">
            Caricamento...
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-0.5">
            {meatItems.length === 0 ? (
              <p className="text-[10px] font-medium text-[#1b2b25]/50 text-center py-2 italic">
                Nessuna proposta per la carne
              </p>
            ) : (
              meatItems.map((meat) => {
                const myVote = meat.meat_votes?.some(
                  (vote: any) => vote.user_id === user?.id
                );
                return (
                  <div
                    key={meat.id}
                    className={`border rounded-lg p-1.5 transition flex flex-col gap-1 ${
                      myVote
                        ? "bg-emerald-50/70 border-emerald-300"
                        : "bg-white/90 border-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => toggleVote(meat)}
                        className="flex-1 text-left flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-black text-[#1b2b25]">
                          🥩 {meat.nome}
                        </span>
                        <span className="text-[9px] font-extrabold bg-[#1b2b25]/10 text-[#1b2b25] px-1.5 py-0.2 rounded-full">
                          👥 {meat.meat_votes?.length || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => deleteMeat(meat)}
                        className="text-[#1b2b25]/30 hover:text-red-500 text-xs px-1 ml-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    {meat.meat_votes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {meat.meat_votes.map((vote: any) => (
                          <span
                            key={vote.user_id}
                            className="text-[8px] font-bold bg-white/80 border border-black/5 text-[#1b2b25]/80 px-1 py-0.2 rounded-md"
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