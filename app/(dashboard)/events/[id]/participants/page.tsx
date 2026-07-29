"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [participants, setParticipants] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function loadParticipants() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    const { data: eventMembers, error } = await supabase
      .from("event_members")
      .select("*")
      .eq("event_id", id);

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    const result = await Promise.all(
      (eventMembers || []).map(async (member: any) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", member.user_id)
          .single();

        return {
          ...member,
          profile,
        };
      })
    );

    const ordered = result.sort((a, b) => {
      const order: any = {
        partecipo: 0,
        forse: 1,
        non_posso: 2,
      };

      return (order[a.stato] ?? 3) - (order[b.stato] ?? 3);
    });

    setParticipants(ordered);
    setLoading(false);
  }

  async function changeStatus(memberId: string, stato: string) {
    setUpdating(true);

    const { error } = await supabase
      .from("event_members")
      .update({ stato })
      .eq("id", memberId);

    if (error) {
      console.log(error);
      alert(error.message);
      setUpdating(false);
      return;
    }

    setParticipants((prev) =>
      prev.map((person) =>
        person.id === memberId ? { ...person, stato } : person
      )
    );

    setUpdating(false);
  }

  useEffect(() => {
    if (id) {
      loadParticipants();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="profilo" size={36} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Caricamento Partecipanti...
        </p>
      </main>
    );
  }

  const countPartecipo = participants.filter((p) => p.stato === "partecipo").length;
  const countForse = participants.filter((p) => p.stato === "forse").length;
  const countNonPosso = participants.filter((p) => p.stato === "non_posso").length;

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-md mx-auto flex flex-col gap-5 select-none">
      
      {/* 🚀 HEADER & BACK */}
      <header className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
          <span className="text-xs font-black text-[#1b2b25] tracking-tight uppercase">
            Membri della Spedizione
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* 📊 SUMMARY BARS */}
      <section className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-4 border border-white shadow-sm flex items-center justify-around text-center">
        <div>
          <div className="text-xs font-black text-emerald-700 uppercase tracking-wider">
            Presenti
          </div>
          <div className="text-xl font-black text-[#1b2b25] mt-0.5">
            {countPartecipo}
          </div>
        </div>
        <div className="h-8 w-px bg-[#1b2b25]/10" />
        <div>
          <div className="text-xs font-black text-amber-700 uppercase tracking-wider">
            In Forse
          </div>
          <div className="text-xl font-black text-[#1b2b25] mt-0.5">
            {countForse}
          </div>
        </div>
        <div className="h-8 w-px bg-[#1b2b25]/10" />
        <div>
          <div className="text-xs font-black text-rose-700 uppercase tracking-wider">
            Assenti
          </div>
          <div className="text-xl font-black text-[#1b2b25] mt-0.5">
            {countNonPosso}
          </div>
        </div>
      </section>

      {/* 👥 LISTA PARTECIPANTI */}
      {participants.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-sm text-center">
          <CustomIcon name="profilo" size={60} className="mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-black text-[#1b2b25]">
            Nessun Partecipante Trovato
          </h3>
          <p className="text-xs font-semibold text-[#1b2b25]/60 mt-1">
            Nessun membro si è ancora iscritto a questa spedizione.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map((person) => (
            <ParticipantCard
              key={person.id}
              person={person}
              user={user}
              changeStatus={changeStatus}
              updating={updating}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function ParticipantCard({
  person,
  user,
  changeStatus,
  updating,
}: any) {
  const [open, setOpen] = useState(false);
  const profile = person.profile;
  const isMe = user?.id === person.user_id;

  // Variabili di Stile per lo Stato
  let borderAccent = "border-l-amber-500";
  let statusBadgeBg = "bg-amber-100 text-amber-900 border-amber-200";
  let statoLabel = "In Forse";
  let statusDot = "🟡";

  if (person.stato === "partecipo") {
    borderAccent = "border-l-emerald-500";
    statusBadgeBg = "bg-emerald-100 text-emerald-900 border-emerald-200";
    statoLabel = "Partecipo";
    statusDot = "🟢";
  } else if (person.stato === "non_posso") {
    borderAccent = "border-l-rose-500";
    statusBadgeBg = "bg-rose-100 text-rose-900 border-rose-200";
    statoLabel = "Non posso";
    statusDot = "🔴";
  }

  // Estrazione precisa di titolo_campo e nome_coniglio
  const titoloCampo = profile?.titolo_campo;
  const nomeConiglio = profile?.nome_coniglio;
  const isPadreFondatore = profile?.ruolo?.toLowerCase() === "admin" || profile?.ruolo?.toLowerCase() === "padre fondatore";

  function formatTimeDetail(date: string, time: string) {
    if (!date) return "Non specificato";
    const d = new Date(date);
    const giorni = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    const giornoStr = giorni[d.getDay()];
    const oraStr = time ? ` • ${String(time).slice(0, 5)}` : "";
    return `${giornoStr} ${date}${oraStr}`;
  }

  return (
    <div
      onClick={() => setOpen(!open)}
      className={`group bg-white/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white border-l-4 ${borderAccent} shadow-sm cursor-pointer active:scale-[0.99] transition-all overflow-hidden`}
    >
      {/* HEADER CARD */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          
          {/* Avatar */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile?.nome || "Avatar"}
              className="w-12 h-12 rounded-2xl object-cover border border-white shadow-2xs shrink-0 mt-0.5"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#ebdec8] flex items-center justify-center border border-white shrink-0 font-black text-[#1b2b25] text-lg mt-0.5 shadow-2xs">
              {profile?.nome ? profile.nome.charAt(0).toUpperCase() : "U"}
            </div>
          )}

          {/* Dati Esploratore */}
          <div className="min-w-0 flex flex-col gap-1.5">
            
            {/* Riga 1: Nome Reale + Badge Tu */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-black text-[#1b2b25] truncate">
                {profile?.nome || "Esploratore"}
              </h3>
              {isMe && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#ebdec8] text-[#1b2b25] text-[9px] font-black uppercase border border-white shadow-xs">
                  Tu
                </span>
              )}
            </div>

            {/* Riga 2: Titolo da Campo / Padre Fondatore & Nome Coniglio */}
            {(isPadreFondatore || titoloCampo || nomeConiglio) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Badge Padre Fondatore */}
                {isPadreFondatore && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1b2b25] text-[#ebdec8] text-[9px] font-black uppercase tracking-wider shadow-xs">
                    <span>🐴</span> Padre Fondatore
                  </span>
                )}

                {/* Badge Titolo da Campo (dalla colonna titolo_campo) */}
                {titoloCampo && !isPadreFondatore && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[9px] font-black uppercase tracking-wider shadow-xs border border-white">
                    <span>⛺</span> {titoloCampo}
                  </span>
                )}

                {/* Badge Nome Coniglio */}
                {nomeConiglio && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-900 border border-amber-500/20 text-[10px] font-extrabold italic shadow-xs">
                    <span>🐰</span> {nomeConiglio}
                  </span>
                )}
              </div>
            )}

            {/* Riga 3: Stato Presenza */}
            <div className="mt-0.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${statusBadgeBg}`}>
                <span>{statusDot}</span>
                <span>{statoLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Freccia espansione */}
        <div className="w-8 h-8 rounded-xl bg-slate-100/80 flex items-center justify-center text-[#1b2b25] text-xs font-black shrink-0 mt-0.5 shadow-xs border border-white">
          {open ? "▲" : "▼"}
        </div>
      </div>

      {/* DETTAGLI ESPANDIBILI */}
      {open && (
        <div className="mt-4 pt-4 border-t border-[#1b2b25]/10 space-y-3 text-xs" onClick={(e) => e.stopPropagation()}>
          
          {/* SELETTORE STATO (SE È L'UTENTE LOGGATO) */}
          {isMe && (
            <div className="p-3 bg-[#1b2b25]/5 rounded-2xl border border-[#1b2b25]/10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1b2b25]/60 block">
                Aggiorna la tua presenza
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  disabled={updating}
                  onClick={() => changeStatus(person.id, "partecipo")}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition border ${
                    person.stato === "partecipo"
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-[#1b2b25] border-white shadow-2xs hover:bg-emerald-50"
                  }`}
                >
                  🟢 Partecipo
                </button>

                <button
                  disabled={updating}
                  onClick={() => changeStatus(person.id, "forse")}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition border ${
                    person.stato === "forse"
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-white text-[#1b2b25] border-white shadow-2xs hover:bg-amber-50"
                  }`}
                >
                  🟡 Forse
                </button>

                <button
                  disabled={updating}
                  onClick={() => changeStatus(person.id, "non_posso")}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition border ${
                    person.stato === "non_posso"
                      ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                      : "bg-white text-[#1b2b25] border-white shadow-2xs hover:bg-rose-50"
                  }`}
                >
                  🔴 Assente
                </button>
              </div>
            </div>
          )}

          {/* DATES & TIMING BOXES */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-white/70 border border-white">
              <span className="text-[9px] font-black uppercase text-[#1b2b25]/50 block">
                🏕️ Arrivo
              </span>
              <span className="text-[11px] font-extrabold text-[#1b2b25] block mt-0.5">
                {formatTimeDetail(person.arrivo_data, person.arrivo_ora)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/70 border border-white">
              <span className="text-[9px] font-black uppercase text-[#1b2b25]/50 block">
                🚗 Partenza
              </span>
              <span className="text-[11px] font-extrabold text-[#1b2b25] block mt-0.5">
                {formatTimeDetail(person.partenza_data, person.partenza_ora)}
              </span>
            </div>
          </div>

          {/* TELEFONO CONTATTO */}
          {profile?.telefono && (
            <a
              href={`tel:${profile.telefono}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#ebdec8] text-[#1b2b25] font-black text-xs border border-white shadow-2xs active:scale-95 transition mt-2"
            >
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>{profile.telefono}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-md">
                Chiama
              </span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}