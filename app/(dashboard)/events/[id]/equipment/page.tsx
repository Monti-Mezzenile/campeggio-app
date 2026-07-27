"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

export default function EquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [items, setItems] = useState<any[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    {
      name: "Attrezzatura Campeggio",
      icon: "⛺",
      color: "border-l-emerald-500",
    },
    {
      name: "Cucina e Bagno",
      icon: "🍳",
      color: "border-l-amber-500",
    },
    {
      name: "Persona e Comfort",
      icon: "🧍",
      color: "border-l-indigo-500",
    },
    {
      name: "Divertimento ed Extra",
      icon: "🎲",
      color: "border-l-purple-500",
    },
    {
      name: "Altro",
      icon: "📦",
      color: "border-l-slate-400",
    },
  ];

  async function loadData() {
    setLoading(true);

    const { data: eventItems, error } = await supabase
      .from("event_equipment")
      .select(`
        id,
        confermato,
        assegnato_a,
        equipment(
          id,
          nome,
          categoria,
          foto,
          quantita
        ),
        profiles:assegnato_a(
          nome,
          avatar_url
        )
      `)
      .eq("event_id", id);

    if (error) {
      console.log(error);
    }

    setItems(eventItems || []);
    setLoading(false);
  }

  async function removeEquipment(eventEquipmentId: string) {
    const confirmDelete = confirm(
      "Rimuovere questo oggetto dall'evento?"
    );

    if (!confirmDelete) {
      return;
    }

    const { error } = await supabase
      .from("event_equipment")
      .delete()
      .eq("id", eventEquipmentId);

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    loadData();
  }

  function getCategory(item: any) {
    const category = item.equipment?.categoria;

    const validCategory = categories.find(
      (cat) => cat.name === category
    );

    if (validCategory) {
      return category;
    }

    return "Altro";
  }

  function getCategoryItems(category: string) {
    return items.filter(
      (item) => getCategory(item) === category
    );
  }

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="zaino" size={36} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Caricamento Attrezzatura...
        </p>
      </main>
    );
  }

  const totalItems = items.length;

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-36 max-w-md mx-auto flex flex-col gap-5 select-none">
      
      {/* 🚀 HEADER & NAVIGATION */}
      <header className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
          <span className="text-xs font-black text-[#1b2b25] tracking-tight uppercase">
            Attrezzatura & Kit
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* 🎒 HERO BANNER */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#ebdec8] bg-[#1b2b25] px-2.5 py-0.5 rounded-full inline-block shadow-2xs">
            🏕️ Equipaggiamento Campo
          </span>
          <h1 className="text-2xl font-black text-[#1b2b25] tracking-tight">
            Materiale Condiviso
          </h1>
          <p className="text-xs font-bold text-[#1b2b25]/60">
            {totalItems} {totalItems === 1 ? "oggetto registrato" : "oggetti registrati"} per la spedizione
          </p>
        </div>

        <CustomIcon name="zaino" size={76} className="shrink-0 drop-shadow-sm" />
      </section>

      {/* 📂 CATEGORIES ACCORDION */}
      <section className="space-y-3">
        {categories.map((category) => {
          const categoryItems = getCategoryItems(category.name);
          const isOpen = openCategory === category.name;

          return (
            <div
              key={category.name}
              className={`bg-white/90 backdrop-blur-2xl border border-white border-l-4 ${category.color} rounded-[2rem] overflow-hidden shadow-sm transition-all`}
            >
              <button
                onClick={() =>
                  setOpenCategory(isOpen ? null : category.name)
                }
                className="w-full p-4 flex items-center justify-between text-left active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl p-2 rounded-2xl bg-slate-100/80 border border-white shadow-2xs shrink-0">
                    {category.icon}
                  </span>

                  <div>
                    <h2 className="text-xs font-black uppercase text-[#1b2b25] tracking-tight">
                      {category.name}
                    </h2>
                    <span className="text-[10px] font-bold text-[#1b2b25]/50">
                      {categoryItems.length}{" "}
                      {categoryItems.length === 1 ? "oggetto" : "oggetti"}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-100/80 flex items-center justify-center text-[#1b2b25] text-xs font-black shrink-0">
                  {isOpen ? "▲" : "▼"}
                </div>
              </button>

              {/* 📋 ELENCO OGGETTI ESPANDIBILE */}
              {isOpen && (
                <div className="p-4 pt-1 border-t border-[#1b2b25]/10 space-y-2.5">
                  {categoryItems.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-xs font-semibold text-[#1b2b25]/40 italic">
                        Nessun oggetto in questa categoria
                      </p>
                    </div>
                  ) : (
                    categoryItems.map((item) => {
                      const profile = item.profiles;
                      const eq = item.equipment;

                      return (
                        <div
                          key={item.id}
                          className="bg-white/80 border border-white p-3 rounded-2xl shadow-2xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {eq?.foto ? (
                              <img
                                src={eq.foto}
                                alt={eq?.nome || "Oggetto"}
                                className="w-12 h-12 rounded-xl object-cover border border-white shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-[#ebdec8]/60 flex items-center justify-center border border-white shrink-0">
                                <CustomIcon name="zaino" size={24} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <h3 className="text-xs font-black text-[#1b2b25] truncate">
                                {eq?.nome || "Oggetto non definito"}
                              </h3>

                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-[#1b2b25]/70">
                                  {profile?.avatar_url ? (
                                    <img
                                      src={profile.avatar_url}
                                      alt={profile.nome}
                                      className="w-3.5 h-3.5 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span>👤</span>
                                  )}
                                  <span className="truncate">
                                    {profile?.nome || "Da assegnare"}
                                  </span>
                                </div>

                                {eq?.quantita && eq.quantita > 1 && (
                                  <span className="font-mono text-[9px] font-black bg-[#1b2b25] text-[#ebdec8] px-1.5 py-0.2 rounded-md">
                                    x{eq.quantita}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => removeEquipment(item.id)}
                            className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-200 text-xs font-black active:scale-90 transition flex items-center justify-center hover:bg-rose-500 hover:text-white shrink-0"
                            title="Rimuovi dall'evento"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

    </main>
  );
}