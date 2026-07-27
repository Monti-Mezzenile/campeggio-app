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
  user_id: string;
  eventTentId?: string;
}

interface Profile {
  id: string;
  nome?: string;
  avatar_url?: string;
  tentMemberId?: string;
}

export default function TentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;
  const tentId = params.tentId as string; // ID di event_tents

  const [tent, setTent] = useState<Tent | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚡ CARICAMENTO PARALLELO OTTIMIZZATO (ZERO WATERFALL)
  async function loadTent() {
    setLoading(true);

    try {
      // 1. Recupera la relazione dell'evento
      const { data: eventTent, error: eventTentError } = await supabase
        .from("event_tents")
        .select("*")
        .eq("id", tentId)
        .maybeSingle();

      if (eventTentError || !eventTent) {
        console.error("Tent non trovata in event_tents:", eventTentError);
        setTent(null);
        setLoading(false);
        return;
      }

      // 2. Esegui in parallelo il recupero dettagli della tenda e della lista membri
      const [tentRes, membersRes] = await Promise.all([
        supabase
          .from("tents")
          .select("*")
          .eq("id", eventTent.tent_id)
          .maybeSingle(),
        supabase
          .from("tent_members")
          .select("id, user_id")
          .eq("event_tent_id", eventTent.id),
      ]);

      const tentData = tentRes.data;
      const membersData = membersRes.data || [];

      if (!tentData) {
        setTent(null);
        setLoading(false);
        return;
      }

      // 3. Raccogli tutti gli ID profilo necessari (Proprietario + Membri) in un unico Batch
      const ownerId = tentData.user_id;
      const memberUserIds = membersData
        .map((m) => m.user_id)
        .filter(Boolean);
      const allProfileIds = Array.from(new Set([ownerId, ...memberUserIds]));

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", allProfileIds);

      const profilesMap = new Map<string, Profile>(
        (profilesData || []).map((p: Profile) => [p.id, p])
      );

      // Set dati nello stato
      setTent({
        ...tentData,
        eventTentId: eventTent.id,
      });

      setOwner(profilesMap.get(ownerId) || null);

      setMembers(
        membersData.map((m) => ({
          ...(profilesMap.get(m.user_id) || { id: m.user_id, nome: "Utente" }),
          tentMemberId: m.id,
        }))
      );
    } catch (err) {
      console.error("ERRORE CARICAMENTO TENDA:", err);
    } finally {
      setLoading(false);
    }
  }

  async function removePerson(tentMemberId: string) {
    const confirmDelete = confirm("Rimuovere questa persona dalla tenda?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("tent_members")
        .delete()
        .eq("id", tentMemberId);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      loadTent();
    } catch (err) {
      console.error("Errore rimozione persona:", err);
    }
  }

  async function removeTentFromEvent() {
    const confirmDelete = confirm(
      "Sei sicuro di voler rimuovere questa tenda dall'evento?"
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("event_tents")
        .delete()
        .eq("id", tentId);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      router.push(`/events/${eventId}/tents`);
    } catch (err) {
      console.error("Errore rimozione tenda:", err);
    }
  }

  useEffect(() => {
    if (tentId) {
      loadTent();
    }
  }, [tentId]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Caricamento dettagli tenda...</p>
      </main>
    );
  }

  if (!tent) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100 flex flex-col items-center justify-center text-center">
        <CustomIcon name="tenda-grossa" size={64} />
        <h2 className="text-xl font-bold mt-4 mb-2 text-white">Tenda non trovata</h2>
        <p className="text-sm text-zinc-400 mb-6">
          La tenda cercata potrebbe essere stata rimossa dall'evento.
        </p>
        <BackButton label="Torna alle Tende" />
      </main>
    );
  }

  const occupati = members.length;
  const posti = tent.posti || 0;
  const liberi = posti - occupati;
  const isFull = liberi <= 0;

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto text-zinc-100">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton label="Tende" />
      </div>

      {/* Header Titolo */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
            <CustomIcon name="tenda-grossa" size={48} />
            <span>{tent.nome}</span>
          </h1>
          {(tent.marca || tent.modello) && (
            <p className="text-sm text-zinc-400 mt-2">
              {tent.marca} {tent.modello}
            </p>
          )}
        </div>

        {/* Badge Stato */}
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${
            isFull
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}
        >
          {isFull ? "COMPLETA 🔴" : `${liberi} liberi 🟢`}
        </span>
      </div>

      {/* Foto Tenda se presente */}
      {tent.foto && (
        <div className="mb-6 h-56 rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl">
          <img
            src={tent.foto}
            alt={tent.nome}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Scheda Statistiche & Grafico Posti */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 backdrop-blur-xl mb-8 shadow-xl">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-mono">
          <span className="font-medium">Capienza Tenda</span>
          <span className="font-bold text-zinc-200">
            {occupati} / {posti} Posti Occupati
          </span>
        </div>

        {/* Grafico Barre Occupazione */}
        <div className="flex gap-1.5 mb-4">
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

        {tent.note && (
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-300 mt-3">
            <span className="font-semibold text-amber-400 block mb-1">
              📝 Note Tenda:
            </span>
            <span className="leading-relaxed">{tent.note}</span>
          </div>
        )}
      </div>

      {/* Sezione Proprietario */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>👑</span> Proprietario Tenda
        </h2>
        {owner ? (
          <PersonCard person={owner} owner />
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-xs text-zinc-400">
            Proprietario non specificato
          </div>
        )}
      </section>

      {/* Sezione Persone nella Tenda */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>👥</span> Persone nella Tenda ({members.length})
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-center text-zinc-400 text-sm">
            Nessuna persona assegnata a questa tenda.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((person) => (
              <PersonCard
                key={person.tentMemberId}
                person={person}
                removePerson={removePerson}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pulsanti Azione */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            router.push(`/events/${eventId}/tents/${tentId}/add-person`);
          }}
          disabled={isFull}
          className={`w-full py-4 px-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            isFull
              ? "bg-zinc-800/50 text-zinc-500 border border-zinc-800 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/15 active:scale-[0.98]"
          }`}
        >
          <span>➕</span>
          <span>
            {isFull ? "Tenda Al Completo" : "Aggiungi Persona alla Tenda"}
          </span>
        </button>

        <button
          onClick={removeTentFromEvent}
          className="w-full py-3.5 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-sm border border-rose-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>🗑️</span>
          <span>Rimuovi Tenda dall'Evento</span>
        </button>
      </div>
    </main>
  );
}

// 👤 COMPONENTE PERSON CARD
function PersonCard({
  person,
  owner = false,
  removePerson,
}: {
  person: Profile;
  owner?: boolean;
  removePerson?: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3.5">
        {person?.avatar_url ? (
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

        <div>
          <p className="font-bold text-white text-base">
            {person?.nome || "Partecipante"}
          </p>
          {owner && (
            <span className="inline-block mt-0.5 text-xs text-amber-400 font-medium">
              Proprietario tenda
            </span>
          )}
        </div>
      </div>

      {!owner && removePerson && person.tentMemberId && (
        <button
          onClick={() => removePerson(person.tentMemberId!)}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95"
          title="Rimuovi dalla tenda"
        >
          🗑️
        </button>
      )}
    </div>
  );
}