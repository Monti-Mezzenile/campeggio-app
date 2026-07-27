"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
import CustomIcon from "@/components/ui/CustomIcon";

interface Passenger {
  passengerId: string;
  id?: string;
  nome?: string;
  avatar_url?: string;
}

interface Person {
  id?: string;
  nome?: string;
  avatar_url?: string;
  passengerId?: string;
}

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;
  const carId = params.carId as string;

  const [car, setCar] = useState<any>(null);
  const [driver, setDriver] = useState<Person | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚡ CARICAMENTO PARALLELO OTTIMIZZATO CON GESTIONE ERRORI PULITA
  async function loadCar() {
    setLoading(true);

    try {
      // 1. Recupera la vettura legata all'evento
      const { data: tripCar, error: tripCarErr } = await supabase
        .from("trip_cars")
        .select("*")
        .eq("id", carId)
        .maybeSingle();

      // Logga solo se c'è un vero errore SQL/Supabase
      if (tripCarErr) {
        console.error("Errore Supabase trip_cars:", tripCarErr.message);
      }

      // Se l'auto non esiste o la query restituisce null, mostra la schermata "Non trovata" senza bloccare Next.js
      if (!tripCar) {
        setCar(null);
        setLoading(false);
        return;
      }

      // 2. Chiamate in parallelo per Auto, Guidatore e Passeggeri
      const [carRes, driverRes, passengersRes] = await Promise.all([
        supabase.from("cars").select("*").eq("id", tripCar.car_id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", tripCar.driver_id).maybeSingle(),
        supabase.from("trip_passengers").select("id, user_id").eq("trip_car_id", carId),
      ]);

      const carData = carRes.data || {};
      const driverData = driverRes.data || null;
      const passengersData = passengersRes.data || [];

      // 3. Se ci sono passeggeri, recupera i loro profili in 1 sola query
      let passengerProfiles: Passenger[] = [];
      if (passengersData.length > 0) {
        const passengerUserIds = passengersData.map((p) => p.user_id).filter(Boolean);

        const { data: profiles } = passengerUserIds.length > 0
          ? await supabase.from("profiles").select("*").in("id", passengerUserIds)
          : { data: [] };

        const profilesMap = new Map((profiles || []).map((prof) => [prof.id, prof]));

        passengerProfiles = passengersData.map((p) => {
          const profile = profilesMap.get(p.user_id);
          return {
            passengerId: p.id,
            id: p.user_id,
            nome: profile?.nome || "Passeggero",
            avatar_url: profile?.avatar_url,
          };
        });
      }

      setCar({
        ...tripCar,
        ...carData,
      });
      setDriver(driverData);
      setPassengers(passengerProfiles);
    } catch (err) {
      console.error("ERRORE CARICAMENTO DETTAGLIO AUTO:", err);
    } finally {
      setLoading(false);
    }
  }

  async function removePassenger(pId: string) {
    const ok = confirm("Rimuovere questa persona dall'auto?");
    if (!ok) return;

    const { error } = await supabase
      .from("trip_passengers")
      .delete()
      .eq("id", pId);

    if (error) {
      alert(error.message);
      return;
    }

    loadCar();
  }

  async function removeCar() {
    const ok = confirm("Rimuovere questa auto dall'evento?");
    if (!ok) return;

    const { error } = await supabase
      .from("trip_cars")
      .delete()
      .eq("id", carId);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/events/${eventId}/cars`);
  }

  useEffect(() => {
    if (carId) {
      loadCar();
    }
  }, [carId]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Caricamento dettagli vettura...</p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="min-h-screen p-4 sm:p-6 max-w-2xl mx-auto text-zinc-100">
        <BackButton label="Auto" />
        <div className="mt-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md">
          <p className="text-zinc-400">Auto non trovata o rimossa dall'evento.</p>
        </div>
      </main>
    );
  }

  const postiTotali = car.posti_disponibili + 1;
  const occupati = passengers.length + 1;
  const liberi = postiTotali - occupati;
  const isFull = liberi <= 0;

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto text-zinc-100">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton label="Auto" />
      </div>

      {/* Foto dell'auto (Se presente) */}
      {car.foto && (
        <div className="w-full h-56 sm:h-64 rounded-3xl overflow-hidden mb-6 bg-zinc-950 border border-zinc-800/80 shadow-2xl relative">
          <img
            src={car.foto}
            alt={car.modello || "Auto"}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Titolo e Icona Grande */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <CustomIcon name="macchina" size={48} />
            <span>{car.modello || "Auto Senza Nome"}</span>
          </h1>
          {car.targa && (
            <span className="inline-block mt-2 px-3 py-1 bg-zinc-800 text-zinc-300 font-mono text-xs rounded-lg border border-zinc-700">
              {car.targa}
            </span>
          )}
        </div>

        {/* Badge Disponibilità */}
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-md ${
            isFull
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}
        >
          {isFull ? "COMPLETA 🔴" : `${liberi} ${liberi === 1 ? "posto libero" : "posti liberi"} 🟢`}
        </span>
      </div>

      {/* Card Riepilogo Posti */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 backdrop-blur-xl mb-8 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
          Stato Posti Abitacolo
        </h3>

        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
            <p className="text-[11px] text-zinc-400 uppercase font-medium">Totali</p>
            <p className="text-xl font-bold text-[#ebdec8] mt-0.5">{postiTotali}</p>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
            <p className="text-[11px] text-zinc-400 uppercase font-medium">Occupati</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{occupati}</p>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
            <p className="text-[11px] text-zinc-400 uppercase font-medium">Liberi</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{liberi}</p>
          </div>
        </div>

        {/* Barra Visuale Posti */}
        <div className="flex gap-1.5">
          <div
            title="Guidatore"
            className="flex-1 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"
          />
          {passengers.map((p) => (
            <div
              key={p.passengerId}
              title={`Passeggero: ${p.nome}`}
              className="flex-1 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"
            />
          ))}
          {Array.from({ length: Math.max(0, liberi) }).map((_, idx) => (
            <div
              key={idx}
              title="Posto Libero"
              className="flex-1 h-3 rounded-full bg-zinc-800 border border-zinc-700/50"
            />
          ))}
        </div>
      </div>

      {/* Sezione Guidatore */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>👑</span> Guidatore Selezionato
        </h2>

        {driver ? (
          <PersonCard person={driver} owner />
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-sm text-zinc-400 italic">
            Nessun guidatore assegnato.
          </div>
        )}
      </section>

      {/* Sezione Passeggeri */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>👥</span> Passeggeri A Bordo
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {passengers.length} / {car.posti_disponibili}
          </span>
        </div>

        {passengers.length === 0 ? (
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-center text-sm text-zinc-400 italic">
            Nessun passeggero ancora prenotato per questo viaggio.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {passengers.map((person) => (
              <PersonCard
                key={person.passengerId}
                person={person}
                removePassenger={removePassenger}
              />
            ))}
          </div>
        )}
      </section>

      {/* Azioni Sulla Macchina */}
      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <button
          onClick={() =>
            router.push(`/events/${eventId}/cars/${carId}/add-passenger`)
          }
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">➕</span>
          <span>Aggiungi Passeggero a Bordo</span>
        </button>

        <button
          onClick={removeCar}
          className="w-full py-3.5 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
        >
          <span>🗑️</span>
          <span>Rimuovi Questa Auto dall'Evento</span>
        </button>
      </div>
    </main>
  );
}

// 👤 COMPONENTE PERSON CARD
function PersonCard({
  person,
  owner = false,
  removePassenger,
}: {
  person: Person;
  owner?: boolean;
  removePassenger?: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-3.5">
        {person?.avatar_url ? (
          <img
            src={person.avatar_url}
            alt={person.nome || "Persona"}
            className="w-12 h-12 rounded-full object-cover border border-zinc-700/60"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg text-zinc-300">
            👤
          </div>
        )}

        <div>
          <p className="font-bold text-white text-base">
            {person?.nome || "Utente"}
          </p>
          {owner ? (
            <span className="inline-block text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md mt-0.5">
              Guidatore principale
            </span>
          ) : (
            <p className="text-xs text-zinc-400">Passeggero</p>
          )}
        </div>
      </div>

      {!owner && removePassenger && person.passengerId && (
        <button
          onClick={() => removePassenger(person.passengerId!)}
          title="Rimuovi passeggero"
          className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700/60 hover:border-rose-500/30 flex items-center justify-center transition-all active:scale-95"
        >
          🗑️
        </button>
      )}
    </div>
  );
}