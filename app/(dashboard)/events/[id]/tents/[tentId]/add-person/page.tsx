"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
import CustomIcon from "@/components/ui/CustomIcon";

interface Profile {
  id: string;
  nome?: string;
  avatar_url?: string;
}

export default function AddPersonPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;
  const tentId = params.tentId as string; // ID di event_tents

  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  const [postiTotali, setPostiTotali] = useState(0);
  const [postiOccupati, setPostiOccupati] = useState(0);
  const [tendaPiena, setTendaPiena] = useState(false);

  // ⚡ CARICAMENTO PARALLELO OTTIMIZZATO (ZERO WATERFALL)
  async function loadPeople() {
    setLoading(true);

    try {
      // 1. Recupera la relazione dell'evento per trovare l'ID tenda reale
      const { data: eventTent, error: eventTentError } = await supabase
        .from("event_tents")
        .select("tent_id")
        .eq("id", tentId)
        .maybeSingle();

      if (eventTentError || !eventTent) {
        console.error("Errore recupero event_tent:", eventTentError);
        setLoading(false);
        return;
      }

      // 2. Query in parallelo: info tenda, occupanti attuali, membri dell'evento, tende dell'evento
      const [tentRes, currentMembersRes, eventMembersRes, allEventTentsRes] =
        await Promise.all([
          supabase
            .from("tents")
            .select("posti, user_id")
            .eq("id", eventTent.tent_id)
            .maybeSingle(),
          supabase
            .from("tent_members")
            .select("*", { count: "exact", head: true })
            .eq("event_tent_id", tentId),
          supabase
            .from("event_members")
            .select("user_id")
            .eq("event_id", eventId),
          supabase
            .from("event_tents")
            .select("id")
            .eq("event_id", eventId),
        ]);

      const tent = tentRes.data;
      if (!tent) {
        setLoading(false);
        return;
      }

      const occupati = currentMembersRes.count || 0;
      const capacita = tent.posti || 0;

      setPostiTotali(capacita);
      setPostiOccupati(occupati);

      // Se la tenda è piena, stop
      if (occupati >= capacita) {
        setTendaPiena(true);
        setPeople([]);
        setLoading(false);
        return;
      }

      const eventUserIds = (eventMembersRes.data || [])
        .map((p) => p.user_id)
        .filter(Boolean);

      if (eventUserIds.length === 0) {
        setPeople([]);
        setLoading(false);
        return;
      }

      // 3. Recupera gli utenti già assegnati a QUALSIASI tenda dell'evento
      const allEventTentIds = (allEventTentsRes.data || []).map((t) => t.id);
      let assignedUserIds: string[] = [];

      if (allEventTentIds.length > 0) {
        const { data: assigned } = await supabase
          .from("tent_members")
          .select("user_id")
          .in("event_tent_id", allEventTentIds);

        assignedUserIds = (assigned || []).map((a) => a.user_id);
      }

      // Filter: persone nell'evento NON ancora in nessuna tenda
      const availableIds = eventUserIds.filter(
        (userId) => !assignedUserIds.includes(userId)
      );

      if (availableIds.length === 0) {
        setPeople([]);
        setLoading(false);
        return;
      }

      // 4. Recupera i profili disponibili
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", availableIds);

      setPeople(profiles || []);
    } catch (err) {
      console.error("Errore durante il caricamento persone:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addPerson(userId: string) {
    if (addingId) return;
    setAddingId(userId);

    try {
      // Controllo di sicurezza capienza
      const { count } = await supabase
        .from("tent_members")
        .select("*", { count: "exact", head: true })
        .eq("event_tent_id", tentId);

      const { data: eventTent } = await supabase
        .from("event_tents")
        .select("tent_id")
        .eq("id", tentId)
        .maybeSingle();

      const { data: tent } = await supabase
        .from("tents")
        .select("posti")
        .eq("id", eventTent?.tent_id)
        .maybeSingle();

      if ((count || 0) >= (tent?.posti || 0)) {
        alert("Questa tenda è ormai completa!");
        setAddingId(null);
        return;
      }

      // Inserimento utente nella tenda
      const { error } = await supabase.from("tent_members").insert({
        event_tent_id: tentId,
        user_id: userId,
      });

      if (error) {
        console.error("ERRORE TENT MEMBERS:", error);
        alert(error.message);
        setAddingId(null);
        return;
      }

      router.push(`/events/${eventId}/tents/${tentId}`);
    } catch (err) {
      console.error("Errore aggiunta persona:", err);
      setAddingId(null);
    }
  }

  useEffect(() => {
    if (tentId) {
      loadPeople();
    }
  }, [tentId]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Caricamento partecipanti...</p>
      </main>
    );
  }

  const liberi = postiTotali - postiOccupati;

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto text-zinc-100">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton label="Dettagli Tenda" />
      </div>

      {/* Header Titolo */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
          <CustomIcon name="tenda-grossa" size={48} />
          <span>Aggiungi Persona</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Assegna un partecipante dell'evento a questa tenda.
        </p>
      </div>

      {/* Scheda Capienza Tenda */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 backdrop-blur-xl mb-8 shadow-xl">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-mono">
          <span className="font-medium">Stato Occupazione</span>
          <span className="font-bold text-zinc-200">
            {postiOccupati} / {postiTotali} Posti
          </span>
        </div>

        {/* Visualizzatore Grafico a Barre */}
        <div className="flex gap-1.5">
          {Array.from({ length: postiOccupati }).map((_, i) => (
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

      {/* Stato: Tenda Completa */}
      {tendaPiena && (
        <div className="bg-zinc-900/40 border border-rose-500/20 rounded-3xl p-8 text-center backdrop-blur-md">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 text-2xl font-bold">
            🚫
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Tenda Completa</h3>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            Non ci sono ulteriori posti disponibili in questa tenda.
          </p>
        </div>
      )}

      {/* Stato: Nessuna Persona Disponibile */}
      {!tendaPiena && people.length === 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 text-center backdrop-blur-md">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <CustomIcon name="tenda-grossa" size={36} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Nessun partecipante disponibile
          </h3>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            Tutti i partecipanti dell'evento sono già stati sistemati in una tenda.
          </p>
        </div>
      )}

      {/* Lista Persone Assegnabili */}
      {!tendaPiena && people.length > 0 && (
        <div className="flex flex-col gap-3">
          {people.map((person) => {
            const isAddingThis = addingId === person.id;

            return (
              <div
                key={person.id}
                className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 backdrop-blur-xl flex items-center justify-between gap-4 transition-all hover:border-zinc-700/80 shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt={person.nome || "Persona"}
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700/60"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xl text-zinc-400">
                      👤
                    </div>
                  )}

                  <span className="font-bold text-white text-base">
                    {person.nome || "Partecipante"}
                  </span>
                </div>

                <button
                  disabled={Boolean(addingId)}
                  onClick={() => addPerson(person.id)}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-md shadow-amber-500/10 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {isAddingThis ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <span>➕</span>
                      <span>Aggiungi</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}