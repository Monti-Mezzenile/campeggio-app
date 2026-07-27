"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";

// --- Utility SVG per pulsanti ed elementi logistici ---
function PlusIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MapPinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function NoteIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function SettingsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

interface Car {
  id: string;
  modello: string;
  posti_totali: number;
  partenza_predefinita?: string;
  note?: string;
  foto?: string;
}

export default function CarsPage() {
  const router = useRouter();

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCars() {
    setLoading(true);
    try {
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
        console.error("ERRORE CARICAMENTO MEZZI:", error);
      }

      setCars(data || []);
    } catch (err) {
      console.error("Errore inatteso:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCars();
  }, []);

  // Statistiche Flotta
  const totalSeats = cars.reduce((acc, car) => acc + (Number(car.posti_totali) || 0), 0);
  const totalCars = cars.length;

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 pb-28 max-w-3xl mx-auto flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-zinc-800 tracking-wide">
          Apertura serranda garage...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-32 max-w-3xl mx-auto text-zinc-900">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton label="Profilo" />
      </div>

      {/* Header Stile "Garage Flotta" */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-950 text-[11px] font-black uppercase tracking-wider mb-1 backdrop-blur-md">
            <img src="/icons/macchina.png" alt="Auto" className="w-5 h-5 object-contain" />
            <span>Vehicle Fleet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
            Il Mio Garage
          </h1>
          {totalCars > 0 && (
            <p className="text-xs font-bold text-zinc-600 mt-1 flex items-center gap-1.5">
              <span>{totalCars} {totalCars === 1 ? "mezzo" : "mezzi"}</span>
              <span>•</span>
              <span className="text-amber-800 font-extrabold flex items-center gap-1.5">
                <img src="/icons/profilo.png" alt="Posti" className="w-4 h-4 object-contain inline" />
                <span>{totalSeats} posti totali</span>
              </span>
            </p>
          )}
        </div>

        {/* Pulsante Aggiungi dello stesso colore panna/ambra tenue del riquadro posti */}
        <button
          onClick={() => router.push("/profile/cars/new")}
          className="h-10 px-3 sm:px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 font-black text-xs shadow-sm active:scale-90 transition-all flex items-center justify-center gap-1.5 shrink-0 border border-amber-500/30 backdrop-blur-md"
        >
          <PlusIcon className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Aggiungi</span>
        </button>
      </div>

      {/* STATO VUOTO */}
      {cars.length === 0 && (
        <div className="bg-white/80 border border-white/90 rounded-3xl p-8 text-center text-zinc-900 shadow-md backdrop-blur-md">
          <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <img src="/icons/macchina.png" alt="Garage vuoto" className="w-12 h-12 object-contain" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 mb-1">
            Nessun Mezzo Registrato
          </h3>
          <p className="text-xs text-zinc-600 max-w-xs mx-auto mb-4">
            Metti a disposizione il tuo veicolo per i viaggi condivisi! Aggiungi la tua prima auto.
          </p>
          <button
            onClick={() => router.push("/profile/cars/new")}
            className="py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 text-xs font-black transition-all active:scale-95 shadow-sm border border-amber-500/30 inline-flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Aggiungi Mezzo</span>
          </button>
        </div>
      )}

      {/* LISTA MEZZI COMPATTA (Griglia 2 Colonne Fisse) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {cars.map((car) => (
          <div
            key={car.id}
            className="bg-white/80 border border-white/90 rounded-2xl p-2.5 sm:p-4 backdrop-blur-md flex flex-col justify-between shadow-md text-zinc-900 hover:shadow-lg hover:border-amber-200 transition-all"
          >
            <div>
              {/* Foto Auto o Immagine "macchina.png" come Fallback */}
              <div className="w-full h-24 sm:h-36 rounded-xl overflow-hidden mb-2 bg-zinc-50 border border-zinc-200/80 p-1 flex items-center justify-center relative shadow-inner">
                <img
                  src={car.foto || "/icons/macchina.png"}
                  alt={car.modello}
                  className={`w-full h-full object-contain ${!car.foto ? "p-2" : ""}`}
                />
              </div>

              {/* Titolo e Badge Posti */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <h2 className="text-xs sm:text-sm font-black text-zinc-950 truncate flex-1 leading-tight">
                  {car.modello}
                </h2>
                {/* Badge Posti (Colore Panna / Amber 500/20) */}
                <span className="shrink-0 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-950 border border-amber-500/30 flex items-center gap-1.5">
                  <img src="/icons/profilo.png" alt="Posti" className="w-4 h-4 object-contain shrink-0" />
                  <span>{car.posti_totali}</span>
                </span>
              </div>

              {/* Informazioni Logistiche */}
              <div className="space-y-1 mb-2">
                {car.partenza_predefinita && (
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-zinc-700 bg-zinc-100/80 px-2 py-1 rounded-lg border border-zinc-200/60 truncate">
                    <MapPinIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{car.partenza_predefinita}</span>
                  </div>
                )}

                {car.note && (
                  <div className="flex items-center gap-1 px-0.5 text-[10px] sm:text-[11px] font-medium text-zinc-500 italic truncate">
                    <NoteIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">"{car.note}"</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pulsante Gestione */}
            <button
              onClick={() => router.push(`/profile/cars/${car.id}`)}
              className="w-full py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-[10px] sm:text-xs transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 mt-1"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-zinc-300" />
              <span>Gestisci</span>
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}