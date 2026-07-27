"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
import CustomIcon from "@/components/ui/CustomIcon";

interface PassengerProfile {
  passengerId: string;
  user_id: string;
  nome: string;
  avatar_url?: string;
}

interface CarItem {
  id: string;
  trip_id: string;
  car_id: string;
  driver_id: string;
  posti_disponibili: number;
  carData?: {
    modello: string;
    foto?: string;
    targa?: string;
  };
  driver?: {
    nome: string;
    avatar_url?: string;
  };
  passengers: PassengerProfile[];
}

export default function CarsEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cars, setCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function getOrCreateTrip() {
    const { data: trips, error } = await supabase
      .from("trips")
      .select("id")
      .eq("event_id", id)
      .order("id")
      .limit(1);

    if (error) {
      console.error("ERRORE TRIP:", error);
      return null;
    }

    let trip = trips?.[0];

    if (!trip) {
      const { data: newTrip, error: createError } = await supabase
        .from("trips")
        .insert({
          event_id: id,
          tipo: "andata",
        })
        .select("id")
        .single();

      if (createError) {
        console.error("ERRORE CREAZIONE TRIP:", createError);
        return null;
      }
      trip = newTrip;
    }

    return trip;
  }

  // ⚡ CARICAMENTO OTTIMIZZATO IN BATCH
  async function loadCars() {
    setLoading(true);

    try {
      const trip = await getOrCreateTrip();
      if (!trip) return;

      const { data: tripCars, error: tripCarsErr } = await supabase
        .from("trip_cars")
        .select("*")
        .eq("trip_id", trip.id);

      if (tripCarsErr || !tripCars || tripCars.length === 0) {
        setCars([]);
        return;
      }

      const carIds = Array.from(new Set(tripCars.map((tc) => tc.car_id).filter(Boolean)));
      const tripCarIds = tripCars.map((tc) => tc.id);
      const driverIds = Array.from(new Set(tripCars.map((tc) => tc.driver_id).filter(Boolean)));

      const [carsRes, passengersRes] = await Promise.all([
        carIds.length > 0
          ? supabase.from("cars").select("*").in("id", carIds)
          : Promise.resolve({ data: [] }),
        tripCarIds.length > 0
          ? supabase.from("trip_passengers").select("id, trip_car_id, user_id").in("trip_car_id", tripCarIds)
          : Promise.resolve({ data: [] }),
      ]);

      const rawCars = carsRes.data || [];
      const rawPassengers = passengersRes.data || [];

      const passengerUserIds = rawPassengers.map((p) => p.user_id);
      const allUserIds = Array.from(new Set([...driverIds, ...passengerUserIds].filter(Boolean)));

      const { data: profiles } = allUserIds.length > 0
        ? await supabase.from("profiles").select("id, nome, avatar_url").in("id", allUserIds)
        : { data: [] };

      const carsMap = new Map(rawCars.map((c) => [c.id, c]));
      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

      const passengersByCar = new Map<string, PassengerProfile[]>();
      rawPassengers.forEach((p) => {
        const prof = profilesMap.get(p.user_id);
        const list = passengersByCar.get(p.trip_car_id) || [];
        list.push({
          passengerId: p.id,
          user_id: p.user_id,
          nome: prof?.nome || "Passeggero",
          avatar_url: prof?.avatar_url,
        });
        passengersByCar.set(p.trip_car_id, list);
      });

      const enrichedCars: CarItem[] = tripCars.map((tc) => {
        const carData = carsMap.get(tc.car_id);
        const driverProf = profilesMap.get(tc.driver_id);
        const passengers = passengersByCar.get(tc.id) || [];

        return {
          ...tc,
          carData,
          driver: driverProf ? { nome: driverProf.nome || "Guidatore", avatar_url: driverProf.avatar_url } : undefined,
          passengers,
        };
      });

      setCars(enrichedCars);
    } catch (err) {
      console.error("ERRORE CARICAMENTO AUTO:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadCars();
    }
  }, [id]);

  const totalCars = cars.length;
  const totalCapacity = cars.reduce((acc, c) => acc + (c.posti_disponibili + 1), 0);
  const totalOccupied = cars.reduce((acc, c) => acc + (c.passengers.length + 1), 0);

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100">
      {/* Intestazione */}
      <div className="flex items-center justify-between mb-6">
        <BackButton label="Evento" />
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-[#ebdec8] border border-white/10 backdrop-blur-md">
          {totalCars} {totalCars === 1 ? "Auto equipaggio" : "Auto equipaggi"}
        </span>
      </div>

      {/* Titolo e Statistiche */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
          <CustomIcon name="macchina" size={48} />
          <span>Convoglio & Equipaggi</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Organizza le macchine e i posti a sedere per la spedizione.
        </p>

        {/* Stats Card */}
        {!loading && totalCars > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Posti Totali</p>
                <p className="text-xl font-bold text-[#ebdec8] mt-0.5">{totalCapacity}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#ebdec8]/10 flex items-center justify-center text-[#ebdec8]">
                🪑
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Occupati</p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">{totalOccupied} / {totalCapacity}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                👥
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tasto Aggiungi Auto */}
      <button
        onClick={() => router.push(`/events/${id}/cars/add`)}
        className="w-full mb-6 py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span className="text-xl">➕</span>
        <span className="text-[15px]">Aggiungi un'Auto al Convoglio</span>
      </button>

      {/* Skeleton Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-zinc-900/50 border border-zinc-800 animate-pulse p-5">
              <div className="h-6 w-1/3 bg-zinc-800 rounded mb-4" />
              <div className="h-4 w-1/2 bg-zinc-800/60 rounded mb-2" />
              <div className="h-4 w-1/4 bg-zinc-800/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && cars.length === 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-10 text-center backdrop-blur-md">
          <div className="w-24 h-24 mx-auto mb-4 rounded-[2rem] bg-amber-500/10 flex items-center justify-center">
            <CustomIcon name="macchina" size={64} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nessun'auto registrata</h3>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">
            Nessun partecipante ha ancora messo a disposizione una macchina per questo evento.
          </p>
        </div>
      )}

      {/* Lista Auto */}
      {!loading && cars.length > 0 && (
        <div className="flex flex-col gap-5">
          {cars.map((item) => {
            const totalSeats = item.posti_disponibili + 1;
            const occupiedSeats = item.passengers.length + 1;
            const freeSeats = totalSeats - occupiedSeats;
            const isFull = freeSeats <= 0;

            return (
              <div
                key={item.id}
                className="group relative bg-zinc-900/70 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-5 backdrop-blur-xl transition-all shadow-xl overflow-hidden"
              >
                {/* Foto Auto (Se presente) */}
                {item.carData?.foto && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 bg-zinc-950 border border-zinc-800/50 relative">
                    <img
                      src={item.carData.foto}
                      alt={item.carData.modello || "Auto"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Header Scheda con CustomIcon */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <CustomIcon name="macchina" size={40} />
                      <span>{item.carData?.modello || "Auto Senza Nome"}</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-2">
                      Guidata da <span className="text-amber-200 font-semibold">{item.driver?.nome || "Utente"}</span>
                    </p>
                  </div>

                  {/* Badge Disponibilità */}
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-md mt-1 ${
                      isFull
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {isFull ? "COMPLETA 🔴" : `${freeSeats} ${freeSeats === 1 ? "posto libero" : "posti liberi"} 🟢`}
                  </span>
                </div>

                {/* Grafico dei Posti */}
                <div className="my-5 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                    <span className="font-medium">Occupazione Abitacolo</span>
                    <span className="font-mono text-zinc-300 font-bold">{occupiedSeats} / {totalSeats}</span>
                  </div>

                  <div className="flex gap-1.5">
                    <div
                      title={`Guidatore: ${item.driver?.nome}`}
                      className="flex-1 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"
                    />
                    {item.passengers.map((p) => (
                      <div
                        key={p.passengerId}
                        title={`Passeggero: ${p.nome}`}
                        className="flex-1 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"
                      />
                    ))}
                    {Array.from({ length: Math.max(0, freeSeats) }).map((_, idx) => (
                      <div
                        key={idx}
                        title="Posto Libero"
                        className="flex-1 h-3 rounded-full bg-zinc-800 border border-zinc-700/50"
                      />
                    ))}
                  </div>
                </div>

                {/* Lista Passeggeri */}
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                    Passeggeri a Bordo
                  </p>

                  {item.passengers.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">
                      Ancora nessun passeggero prenotato per questa macchina.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {item.passengers.map((p) => (
                        <span
                          key={p.passengerId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-[13px] font-medium text-zinc-200 shadow-sm"
                        >
                          <span className="text-zinc-400 text-[10px]">👤</span>
                          {p.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pulsante Azione */}
                <button
                  onClick={() => router.push(`/events/${id}/cars/${item.id}`)}
                  className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-sm font-semibold text-zinc-200 transition-all flex items-center justify-center gap-2 group-hover:border-amber-500/30"
                >
                  <span>Gestisci Posti & Dettagli</span>
                  <span className="text-amber-400 transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}