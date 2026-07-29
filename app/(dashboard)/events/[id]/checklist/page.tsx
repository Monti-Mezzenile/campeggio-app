"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

// Configurazione Categorie
const CATEGORIES = [
  { id: "Attrezzatura Campeggio", label: "Attrezzatura Campeggio", icon: "🎪" },
  { id: "Vestiti e Oggetti Personali", label: "Vestiti e Oggetti Personali", icon: "👕" },
  { id: "Cucina e Bagno", label: "Cucina e Bagno", icon: "🍳" },
  { id: "Persona e Comfort", label: "Persona e Comfort", icon: "🛋️" },
  { id: "Divertimento ed Extra", label: "Divertimento ed Extra", icon: "🎲" },
  { id: "Altro", label: "Altro", icon: "📦" },
];

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [checklistId, setChecklistId] = useState("");
  const [items, setItems] = useState<any[]>([]); 
  const [equipment, setEquipment] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [showEquipment, setShowEquipment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");

  // Filtri
  const [activeTab, setActiveTab] = useState("Tutti");
  const [seasonFilter, setSeasonFilter] = useState("tutti"); // "tutti", "estivo", "invernale"

  async function loadChecklist() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    /* 1. CARICO / CREO LA CHECKLIST PER QUESTO EVENTO */
    let { data: checklist } = await supabase
      .from("checklists")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!checklist) {
      const { data: newChecklist, error: createError } = await supabase
        .from("checklists")
        .insert({
          event_id: eventId,
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.log("ERRORE CREAZIONE CHECKLIST:", createError);
        setLoading(false);
        return;
      }

      checklist = newChecklist;
    }

    setChecklistId(checklist.id);

    /* 2. CARICO L'ATTREZZATURA PERSONALE (Estraggo categoria e colonna stagione) */
    const { data: equipmentData } = await supabase
      .from("equipment")
      .select("*")
      .eq("user_id", user.id);

    const userEquipment = equipmentData || [];
    setEquipment(userEquipment);

    /* 3. CARICO GLI ELEMENTI CHECKLIST E ASSOCIO CATEGORIA E STAGIONE DAL TABELLARE EQUIPMENT */
    const { data: itemsData } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("checklist_id", checklist.id)
      .order("created_at", { ascending: true });

    const processedItems = (itemsData || []).map((item: any) => {
      if (item.equipment_id) {
        const eq = userEquipment.find((e) => e.id === item.equipment_id);
        
        // Leggo ed elaboro la colonna stagione da equipment
        const rawStagione = eq?.stagione ? String(eq.stagione).toLowerCase().trim() : null;

        return { 
          ...item, 
          category: eq?.categoria || "Altro",
          stagione: rawStagione // 'estivo', 'invernale', 'entrambi', oppure null
        };
      }
      return { ...item, category: "Manuale", stagione: null };
    });

    setItems(processedItems);
    setLoading(false);
  }

  async function addItem() {
    if (!nome.trim()) return;

    const { error } = await supabase.from("checklist_items").insert({
      checklist_id: checklistId,
      nome: nome.trim(),
      completato: false,
    });

    if (error) {
      console.log("ERRORE INSERIMENTO ITEM:", error);
      return;
    }

    setNome("");
    if (activeTab !== "Tutti" && activeTab !== "Manuale") {
      setActiveTab("Manuale");
    }
    if (seasonFilter !== "tutti") {
      setSeasonFilter("tutti");
    }
    loadChecklist();
  }

  function toggleEquipment(id: string) {
    if (selectedEquipment.includes(id)) {
      setSelectedEquipment(selectedEquipment.filter((item) => item !== id));
    } else {
      setSelectedEquipment([...selectedEquipment, id]);
    }
  }

  async function addEquipmentRows(rows: any[]) {
    if (rows.length === 0) return;

    const { error } = await supabase.from("checklist_items").insert(rows);

    if (error) {
      console.log("ERRORE INSERIMENTO ATTREZZATURA:", error);
      return;
    }

    setSelectedEquipment([]);
    setShowEquipment(false);
    setActiveTab("Tutti");
    setSeasonFilter("tutti");
    loadChecklist();
  }

  async function addEquipmentToChecklist() {
    const existingIds = items
      .filter((item) => item.equipment_id)
      .map((item) => item.equipment_id);

    const selected = equipment.filter(
      (item) =>
        selectedEquipment.includes(item.id) && !existingIds.includes(item.id)
    );

    const rows = selected.map((item) => ({
      checklist_id: checklistId,
      nome: item.nome,
      equipment_id: item.id,
      completato: false,
    }));

    await addEquipmentRows(rows);
  }

  async function addAllEquipmentToChecklist() {
    const existingIds = items
      .filter((item) => item.equipment_id)
      .map((item) => item.equipment_id);

    const rows = equipment
      .filter((item) => !existingIds.includes(item.id))
      .map((item) => ({
        checklist_id: checklistId,
        nome: item.nome,
        equipment_id: item.id,
        completato: false,
      }));

    await addEquipmentRows(rows);
  }

  async function toggleItem(id: string, value: boolean) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const item = items.find((item) => item.id === id);
    if (!item) return;

    const { error: updateError } = await supabase
      .from("checklist_items")
      .update({ completato: value })
      .eq("id", id);

    if (updateError) {
      console.log("ERRORE CHECK ITEM:", updateError);
      return;
    }

    const isPersonalClothing = item.category === "Vestiti e Oggetti Personali";

    if (value && item.equipment_id && !isPersonalClothing) {
      await supabase
        .from("event_equipment")
        .upsert(
          {
            event_id: eventId,
            equipment_id: item.equipment_id,
            assegnato_a: user.id,
            confermato: true,
          },
          { onConflict: "event_id,equipment_id,assegnato_a" }
        );
    }

    if (!value && item.equipment_id && !isPersonalClothing) {
      await supabase
        .from("event_equipment")
        .delete()
        .eq("event_id", eventId)
        .eq("equipment_id", item.equipment_id)
        .eq("assegnato_a", user.id);
    }

    loadChecklist();
  }

  async function deleteItem(id: string) {
    await supabase.from("checklist_items").delete().eq("id", id);
    loadChecklist();
  }

  useEffect(() => {
    if (eventId) {
      loadChecklist();
    }
  }, [eventId]);

  const getSeasonBadge = (stg?: string | null) => {
    if (!stg) return null;
    const s = stg.toLowerCase();
    
    if (s === "estivo") {
      return { label: "Estivo", icon: "☀️", color: "bg-amber-100 text-amber-900 border-amber-200" };
    }
    if (s === "invernale") {
      return { label: "Invernale", icon: "❄️", color: "bg-blue-100 text-blue-900 border-blue-200" };
    }
    if (s === "entrambi") {
      return { label: "4 Stagioni", icon: "🔄", color: "bg-slate-100 text-slate-800 border-slate-200" };
    }
    return null;
  };

  if (loading) {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center shadow-lg animate-pulse mb-3 border border-white">
          <CustomIcon name="zaino" size={36} />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#1b2b25]">
          Caricamento Checklist...
        </p>
      </main>
    );
  }

  const completati = items.filter((item) => item.completato).length;
  const percentuale = items.length
    ? Math.round((completati / items.length) * 100)
    : 0;

  // Filtraggio Combinato: Categoria + Colonna stagione da Equipment
  const filteredItems = items.filter((item) => {
    const matchCategory = activeTab === "Tutti" || item.category === activeTab;
    
    const itemSeason = item.stagione ? item.stagione.toLowerCase() : null;
    const matchSeason =
      seasonFilter === "tutti" ||
      itemSeason === "entrambi" ||
      itemSeason === seasonFilter;

    return matchCategory && matchSeason;
  });

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-36 max-w-md mx-auto flex flex-col gap-5 select-none">
      
      {/* 🚀 BARRA TOP */}
      <header className="flex items-center justify-between pt-1">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-lg shadow-sm backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
          <span className="text-xs font-black text-[#1b2b25] tracking-tight uppercase">
            Checklist Personale
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* 📊 HERO PROGRESS CARD */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
              {percentuale === 100 && items.length > 0
                ? "🎉 Tutto Pronto!"
                : "🎒 Preparativi Zaino"}
            </span>
            <h1 className="text-2xl font-black text-[#1b2b25] tracking-tight">
              I Tuoi Oggetti
            </h1>
          </div>

          <div className="text-right">
            <span className="font-mono text-2xl font-black text-[#1b2b25]">
              {completati}
              <span className="text-sm font-bold text-[#1b2b25]/40">
                /{items.length}
              </span>
            </span>
            <p className="text-[10px] font-extrabold text-[#1b2b25]/50 uppercase tracking-wider">
              Pronti
            </p>
          </div>
        </div>

        {/* BARRA DI AVANZAMENTO */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-2xs"
              style={{ width: `${percentuale}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-black text-[#1b2b25]/60 uppercase tracking-wider">
            <span>Avanzamento</span>
            <span>{percentuale}%</span>
          </div>
        </div>
      </section>

      {/* 🎒 IMPORTA DA EQUIPAGGIAMENTO PERSONALE */}
      <section className="space-y-3">
        <button
          onClick={() => setShowEquipment(!showEquipment)}
          className="w-full py-3.5 px-5 rounded-[2rem] bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-sm active:scale-[0.98] transition flex items-center justify-between border border-[#1b2b25]"
        >
          <div className="flex items-center gap-3">
            <CustomIcon name="zaino" size={26} />
            <span>Importa dal tuo Zaino</span>
          </div>
          <span className="text-sm">{showEquipment ? "▲" : "▼"}</span>
        </button>

        {showEquipment && (
          <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-[2.5rem] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1b2b25]">
                  Attrezzatura Salvata ({equipment.length})
                </h3>
                <p className="text-[10px] font-bold text-[#1b2b25]/50 mt-0.5">
                  Seleziona gli oggetti da mettere in lista
                </p>
              </div>

              {equipment.length > 0 && (
                <button
                  onClick={addAllEquipmentToChecklist}
                  className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition shrink-0"
                >
                  ➕ Tutti
                </button>
              )}
            </div>

            {equipment.length === 0 ? (
              <p className="text-xs font-semibold text-[#1b2b25]/50 text-center py-4">
                Nessun oggetto trovato nel tuo profilo personale.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {CATEGORIES.map((cat) => {
                  const catEquipment = equipment.filter((e) => e.categoria === cat.id);
                  if (catEquipment.length === 0) return null;

                  return (
                    <div key={cat.id} className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 ml-1">
                        <span>{cat.icon}</span> {cat.label}
                      </h4>
                      
                      <div className="space-y-1.5">
                        {catEquipment.map((item) => {
                          const isSelected = selectedEquipment.includes(item.id);
                          const isAlreadyInList = items.some((i) => i.equipment_id === item.id);
                          const seasonBadge = getSeasonBadge(item.stagione);

                          return (
                            <div
                              key={item.id}
                              onClick={() => !isAlreadyInList && toggleEquipment(item.id)}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                                isAlreadyInList
                                  ? "bg-slate-100/50 border-slate-200 opacity-50 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-emerald-50 border-emerald-300 shadow-2xs"
                                  : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-[#1b2b25] truncate">
                                  {item.nome}
                                </span>
                                {seasonBadge && (
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md border ${seasonBadge.color}`}>
                                    {seasonBadge.icon}
                                  </span>
                                )}
                              </div>

                              {isAlreadyInList ? (
                                <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md shrink-0">
                                  Già in lista
                                </span>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-black transition shrink-0 ${
                                    isSelected
                                      ? "bg-emerald-500 border-emerald-600 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isSelected && "✓"}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedEquipment.length > 0 && (
              <button
                onClick={addEquipmentToChecklist}
                className="w-full py-3 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition mt-2"
              >
                Aggiungi Selezionati ({selectedEquipment.length})
              </button>
            )}
          </div>
        )}
      </section>

      {/* ➕ FORM NUOVO ELEMENTO MANUALE */}
      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
          className="flex gap-2"
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Aggiungi oggetto libero (es. Torcia)..."
            className="flex-1 bg-white/90 backdrop-blur-md border border-white rounded-2xl px-4 py-3 text-xs font-bold text-[#1b2b25] placeholder-[#1b2b25]/40 outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-xs"
          />
          <button
            type="submit"
            className="px-5 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-lg font-black shadow-sm active:scale-95 transition flex items-center justify-center"
          >
            +
          </button>
        </form>
      </section>

      {/* 🗂 FILTRI: CATEGORIA E STAGIONE DA EQUIPMENT */}
      {items.length > 0 && (
        <section className="space-y-3">
          
          {/* CATEGORIE (Tab Orizzontale) */}
          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2 w-max px-1">
              <button
                onClick={() => setActiveTab("Tutti")}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTab === "Tutti"
                    ? "bg-[#1b2b25] text-[#ebdec8] border-[#1b2b25]"
                    : "bg-white text-[#1b2b25]/70 border-white hover:border-slate-200 shadow-2xs"
                }`}
              >
                Tutti ({items.length})
              </button>

              {items.some(i => i.category === "Manuale") && (
                 <button
                   onClick={() => setActiveTab("Manuale")}
                   className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                     activeTab === "Manuale"
                       ? "bg-[#1b2b25] text-[#ebdec8] border-[#1b2b25]"
                       : "bg-white text-[#1b2b25]/70 border-white hover:border-slate-200 shadow-2xs"
                   }`}
                 >
                   <span>✍️</span>
                   <span>A mano ({items.filter(i => i.category === "Manuale").length})</span>
                 </button>
              )}

              {CATEGORIES.map((cat) => {
                const count = items.filter(i => i.category === cat.id).length;
                if (count === 0) return null;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                      activeTab === cat.id
                        ? "bg-[#1b2b25] text-[#ebdec8] border-[#1b2b25]"
                        : "bg-white text-[#1b2b25]/70 border-white hover:border-slate-200 shadow-2xs"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="font-mono opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SOTTO-FILTRO STAGIONE (Basato su colonna stagione) */}
          <div className="grid grid-cols-3 gap-1.5 bg-white/60 p-1 rounded-2xl border border-white backdrop-blur-md shadow-2xs">
            <button
              onClick={() => setSeasonFilter("tutti")}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                seasonFilter === "tutti"
                  ? "bg-[#1b2b25] text-white shadow-xs"
                  : "text-[#1b2b25]/60 hover:bg-white/50"
              }`}
            >
              <span>🎒</span>
              <span>Tutti</span>
            </button>
            <button
              onClick={() => setSeasonFilter("estivo")}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                seasonFilter === "estivo"
                  ? "bg-amber-500 text-amber-950 shadow-xs border border-amber-600"
                  : "text-[#1b2b25]/60 hover:bg-white/50"
              }`}
            >
              <span>☀️</span>
              <span>Estivi</span>
            </button>
            <button
              onClick={() => setSeasonFilter("invernale")}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                seasonFilter === "invernale"
                  ? "bg-blue-600 text-white shadow-xs border border-blue-700"
                  : "text-[#1b2b25]/60 hover:bg-white/50"
              }`}
            >
              <span>❄️</span>
              <span>Invernali</span>
            </button>
          </div>
        </section>
      )}

      {/* 📋 LISTA ELEMENTI CHECKLIST (Filtrata) */}
      <section className="space-y-2.5">
        {items.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-sm text-center space-y-2">
            <CustomIcon name="zaino" size={52} className="mx-auto mb-1 opacity-40" />
            <h3 className="text-sm font-black text-[#1b2b25]">
              La Checklist è Vuota
            </h3>
            <p className="text-xs font-semibold text-[#1b2b25]/50">
              Scrivi un oggetto qui sopra o importalo direttamente dal tuo zaino.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
           <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-sm text-center space-y-2">
            <p className="text-xs font-semibold text-[#1b2b25]/50 italic">
              Nessun oggetto trovato per la stagione/categoria selezionata.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isDone = item.completato;
            const standardCat = CATEGORIES.find((c) => c.id === item.category);
            const seasonBadge = getSeasonBadge(item.stagione);

            return (
              <div
                key={item.id}
                className={`group bg-white/90 backdrop-blur-2xl rounded-2xl p-3.5 border border-white shadow-2xs flex items-center justify-between gap-3 transition-all ${
                  isDone ? "opacity-60 bg-white/50" : ""
                }`}
              >
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!item.completato}
                    onChange={(e) => toggleItem(item.id, e.target.checked)}
                    className="sr-only"
                  />
                  
                  {/* CHECKBOX CUSTOM */}
                  <div
                    className={`w-6 h-6 rounded-xl border flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                      isDone
                        ? "bg-emerald-500 border-emerald-600 text-white scale-95 shadow-2xs"
                        : "bg-white border-slate-300 text-transparent hover:border-emerald-400"
                    }`}
                  >
                    ✓
                  </div>

                  <div className="min-w-0 flex flex-col items-start gap-1">
                    <span
                      className={`text-xs font-bold text-[#1b2b25] block truncate w-full ${
                        isDone ? "line-through text-[#1b2b25]/60" : ""
                      }`}
                    >
                      {item.nome}
                    </span>

                    {/* BADGES: CATEGORIA + STAGIONE DA EQUIPMENT */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {activeTab === "Tutti" && (
                        <span className="text-[9px] font-black uppercase text-[#1b2b25]/70 bg-[#1b2b25]/5 border border-[#1b2b25]/10 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
                          {standardCat ? (
                            <>
                              <span>{standardCat.icon}</span>
                              <span>{standardCat.label}</span>
                            </>
                          ) : item.category === "Manuale" ? (
                            <>
                              <span>✍️</span>
                              <span>A mano</span>
                            </>
                          ) : (
                            <>
                              <span>🎒</span>
                              <span>Equipaggiamento</span>
                            </>
                          )}
                        </span>
                      )}

                      {seasonBadge && (
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap border shadow-2xs ${seasonBadge.color}`}>
                          <span>{seasonBadge.icon}</span>
                          <span>{seasonBadge.label}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </label>

                <button
                  onClick={() => deleteItem(item.id)}
                  className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-200 text-xs font-black active:scale-90 transition flex items-center justify-center hover:bg-rose-500 hover:text-white shrink-0 shadow-2xs"
                  title="Elimina"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </section>

    </main>
  );
}