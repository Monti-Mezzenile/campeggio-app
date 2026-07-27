"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

interface UserProfile {
  id: string;
  nome: string;
  avatar_url?: string;
}

export default function AddPassengerPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;
  const carId = params.carId as string;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [existing, setExisting] = useState<string[]>([]);
  const [driver, setDriver] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // ⚡ CARICAMENTO PARALLELO OTTIMIZZATO
  async function loadData() {
    setLoading(true);

    try {
      // 1. Recupera la macchina dell'evento (.maybeSingle() anti-crash)
      const { data: tripCar, error: carErr } = await supabase
        .from("trip_cars")
        .select("*")
        .eq("id", carId)
        .maybeSingle();

      if (carErr || !tripCar) {
        console.error("ERRORE CARICAMENTO TRIP CAR:", carErr);
        setLoading(false);
        return;
      }

      setDriver(tripCar.driver_id);

      // 2. Query in parallelo per Membri dell'evento e Passeggeri già registrati
      const [membersRes, passengersRes] = await Promise.all([
        supabase
          .from("event_members")
          .select("user_id")
          .eq("event_id", eventId)
          .eq("stato", "partecipo"),
        supabase
          .from("trip_passengers")
          .select("user_id")
          .eq("trip_car_id", carId),
      ]);

      const memberIds = (membersRes.data || [])
        .map((m) => m.user_id)
        .filter(Boolean);

      const passengerIds = (passengersRes.data || [])
        .map((p) => p.user_id)
        .filter(Boolean);

      setExisting(passengerIds);

      // 3. Recupera i profili degli utenti partecipanti
      if (memberIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id, nome, avatar_url")
          .in("id", memberIds);

        if (profErr) {
          console.error("ERRORE PROFILI:", profErr);
        }

        // Escludi il guidatore della macchina attuale
        const availableProfiles = (profiles || []).filter(
          (user) => user.id !== tripCar.driver_id
        );

        setUsers(availableProfiles);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("ERRORE INESPETTATO:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addPassenger(userId: string) {
    if (addingUserId) return;

    setAddingUserId(userId);

    const { error } = await supabase.from("trip_passengers").insert({
      trip_car_id: carId,
      user_id: userId,
    });

    if (error) {
      alert(error.message);
      setAddingUserId(null);
      return;
    }

    router.push(`/events/${eventId}/cars/${carId}`);
  }

  useEffect(() => {
    if (carId) {
      loadData();
    }
  }, [carId]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Caricamento partecipanti...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton label="Dettaglio Auto" />
      </div>

      {/* Titolo Principale */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <span>👥</span>
          <span>Aggiungi Passeggero</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Seleziona un partecipante confermato all'evento da aggiungere all'equipaggio di questa auto.
        </p>
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 text-center backdrop-blur-md">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl text-amber-400">
            👥
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nessun utente disponibile</h3>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            Non ci sono altri partecipanti confermati all'evento disponibili per l'assegnazione.
          </p>
        </div>
      )}

      {/* Lista Utenti Selezionabili */}
      {users.length > 0 && (
        <div className="flex flex-col gap-3">
          {users.map((user) => {
            const isAlreadyInCar = existing.includes(user.id);
            const isAddingThisUser = addingUserId === user.id;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 backdrop-blur-xl transition-all shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.nome || "Utente"}
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700/60"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg text-zinc-300">
                      👤
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-white text-base">
                      {user.nome || "Partecipante"}
                    </p>
                    <p className="text-xs text-zinc-400">Confermato all'evento</p>
                  </div>
                </div>

                {isAlreadyInCar ? (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/80">
                    Già a bordo
                  </span>
                ) : (
                  <button
                    disabled={addingUserId !== null}
                    onClick={() => addPassenger(user.id)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-md shadow-amber-500/10 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingThisUser ? (
                      <span className="animate-pulse text-xs">Aggiunta...</span>
                    ) : (
                      <>
                        <span>➕</span>
                        <span>Aggiungi</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}