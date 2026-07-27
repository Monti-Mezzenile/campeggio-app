"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
import CustomIcon from "@/components/ui/CustomIcon";

interface Car {
  id: string;
  modello: string;
  foto?: string;
  posti_totali: number;
  partenza_predefinita?: string;
}

export default function AddEventCarPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCarId, setAddingCarId] = useState<string | null>(null);

  // 🛡️ FIX DELL'ERRORE: Usiamo .limit(1) per evitare crash se ci sono più trip per lo stesso evento
  async function getOrCreateTrip() {
    const { data: trips, error: findError } = await supabase
      .from("trips")
      .select("*")
      .eq("event_id", id)
      .order("id")
      .limit(1);

    if (findError) {
      console.error("ERRORE RICERCA TRIP:", findError);
      alert(findError.message);
      return null;
    }

    if (trips && trips.length > 0) {
      return trips[0];
    }

    // Se non esiste ancora un trip per questo evento, ne creiamo uno
    const { data: newTrips, error: createError } = await supabase
      .from("trips")
      .insert({
        event_id: id,
        tipo: "andata",
      })
      .select();

    if (createError || !newTrips || newTrips.length === 0) {
      console.error("ERRORE CREAZIONE TRIP:", createError);
      alert(createError?.message || "Impossibile creare il viaggio");
      return null;
    }

    return newTrips[0];
  }

  async function loadCars() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (error) {
      console.error("ERRORE CARICAMENTO AUTO PERSONALI:", error);
    }

    setCars(data || []);
    setLoading(false);
  }

  async function addCar(car: Car) {
    if (addingCarId) return;

    setAddingCarId(car.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAddingCarId(null);
      return;
    }

    const trip = await getOrCreateTrip();

    if (!trip) {
      setAddingCarId(null);
      return;
    }

    // Check presenza auto con limit(1) anti-crash
    const { data: alreadyList, error: alreadyErr } = await supabase
      .from("trip_cars")
      .select("id")
      .eq("trip_id", trip.id)
      .eq("car_id", car.id)
      .limit(1);

    if (alreadyErr) {
      console.error(alreadyErr);
    }

    if (alreadyList && alreadyList.length > 0) {
      alert("Questa auto è già presente nell'evento");
      setAddingCarId(null);
      return;
    }

    const postiDisponibili = Math.max((car.posti_totali || 1) - 1, 0);

    const { error } = await supabase.from("trip_cars").insert({
      trip_id: trip.id,
      car_id: car.id,
      driver_id: user.id,
      posti_disponibili: postiDisponibili,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      setAddingCarId(null);
      return;
    }

    router.push(`/events/${id}/cars`);
  }

  useEffect(() => {
    if (id) {
      loadCars();
    }
  }, [id]);

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-2xl mx-auto text-zinc-100">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton label="Auto evento" />
      </div>

      {/* Titolo Principale con Icona Grande */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
          <CustomIcon name="macchina" size={48} />
          <span>Scegli il tuo Mezzo</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Seleziona quale delle tue auto vuoi mettere a disposizione del gruppo per questo evento.
        </p>
      </div>

      {/* Skeleton Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-zinc-900/50 border border-zinc-800 animate-pulse p-5">
              <div className="h-6 w-1/3 bg-zinc-800 rounded mb-4" />
              <div className="h-4 w-1/2 bg-zinc-800/60 rounded mb-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State: L'utente non ha registrato macchine nel suo profilo */}
      {!loading && cars.length === 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 text-center backdrop-blur-md">
          <div className="w-24 h-24 mx-auto mb-4 rounded-[2rem] bg-amber-500/10 flex items-center justify-center">
            <CustomIcon name="macchina" size={64} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nessuna macchina nel tuo garage</h3>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto mb-6">
            Non hai ancora registrato nessuna vettura nel tuo profilo personale.
          </p>
        </div>
      )}

      {/* Lista Auto Selezionabili */}
      {!loading && cars.length > 0 && (
        <div className="flex flex-col gap-5">
          {cars.map((car) => (
            <div
              key={car.id}
              className="group bg-zinc-900/70 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-3xl p-5 backdrop-blur-xl transition-all shadow-xl overflow-hidden"
            >
              {/* Foto Auto */}
              {car.foto && (
                <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 bg-zinc-950 border border-zinc-800/50 relative">
                  <img
                    src={car.foto}
                    alt={car.modello}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Dettagli Auto */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CustomIcon name="macchina" size={36} />
                    <span>{car.modello}</span>
                  </h2>
                  {car.partenza_predefinita && (
                    <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                      <span>📍 Partenza da:</span>
                      <span className="text-zinc-200 font-medium">{car.partenza_predefinita}</span>
                    </p>
                  )}
                </div>

                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 backdrop-blur-md">
                  🪑 {car.posti_totali} {car.posti_totali === 1 ? "posto" : "posti"}
                </span>
              </div>

              {/* Pulsante Selezione */}
              <button
                disabled={addingCarId === car.id}
                onClick={() => addCar(car)}
                className="mt-5 w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingCarId === car.id ? (
                  <span className="animate-pulse">Aggiunta in corso...</span>
                ) : (
                  <>
                    <span className="text-lg">➕</span>
                    <span>Porta questa auto per l'evento</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}