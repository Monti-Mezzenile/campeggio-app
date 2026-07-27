"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

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

  async function loadChecklist() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    /* PRENDO LA CHECKLIST ESISTENTE (evento + utente) */
    let { data: checklist, error: checkError } = await supabase
      .from("checklists")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    console.log("CHECKLIST TROVATA:", checklist, checkError);

    /* SE NON ESISTE LA CREO */
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

    /* CARICO GLI ELEMENTI */
    const { data: itemsData, error: itemsError } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("checklist_id", checklist.id)
      .order("created_at", { ascending: true });

    console.log("ITEM CHECKLIST:", itemsData, itemsError);
    setItems(itemsData || []);

    /* CARICO ATTREZZATURA PERSONALE */
    const { data: equipmentData, error: equipmentError } = await supabase
      .from("equipment")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    console.log("MIA ATTREZZATURA:", equipmentData, equipmentError);
    setEquipment(equipmentData || []);

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

    if (value && item.equipment_id) {
      const { error: eventEquipmentError } = await supabase
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

      if (eventEquipmentError) {
        console.log("ERRORE EVENT EQUIPMENT:", eventEquipmentError);
      }
    }

    if (!value && item.equipment_id) {
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
    const { error } = await supabase
      .from("checklist_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("ERRORE DELETE ITEM:", error);
      return;
    }

    loadChecklist();
  }

  useEffect(() => {
    if (eventId) {
      loadChecklist();
    }
  }, [eventId]);

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

  return (
    <main className="min-h-screen p-4 sm:p-6 pb-36 max-w-md mx-auto flex flex-col gap-5 select-none">
      
      {/* 🚀 BARRA TOP & ACTIONS */}
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1b2b25]">
                  Attrezzatura Salvata ({equipment.length})
                </h3>
                <p className="text-[10px] font-bold text-[#1b2b25]/50">
                  Seleziona gli oggetti da mettere in lista
                </p>
              </div>

              {equipment.length > 0 && (
                <button
                  onClick={addAllEquipmentToChecklist}
                  className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition"
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
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {equipment.map((item) => {
                  const isSelected = selectedEquipment.includes(item.id);
                  const isAlreadyInList = items.some(
                    (i) => i.equipment_id === item.id
                  );

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        !isAlreadyInList && toggleEquipment(item.id)
                      }
                      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                        isAlreadyInList
                          ? "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "bg-emerald-50 border-emerald-300 shadow-2xs"
                          : "bg-white/80 border-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-[#1b2b25]">
                        {item.nome}
                      </span>

                      {isAlreadyInList ? (
                        <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                          Già in lista
                        </span>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-black transition ${
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
            )}

            {selectedEquipment.length > 0 && (
              <button
                onClick={addEquipmentToChecklist}
                className="w-full py-3 rounded-2xl bg-[#1b2b25] text-[#ebdec8] text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition"
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
            placeholder="Aggiungi oggetto (es. Torcia, Sacco a pelo)..."
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

      {/* 📋 LISTA ELEMENTI CHECKLIST */}
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
        ) : (
          items.map((item) => {
            const isDone = item.completato;
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

                  <div className="min-w-0">
                    <span
                      className={`text-xs font-bold text-[#1b2b25] block truncate ${
                        isDone ? "line-through text-[#1b2b25]/60" : ""
                      }`}
                    >
                      {item.nome}
                    </span>

                    {item.equipment_id && (
                      <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded-md inline-block mt-0.5">
                        🎒 Equipaggiamento
                      </span>
                    )}
                  </div>
                </label>

                <button
                  onClick={() => deleteItem(item.id)}
                  className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-200 text-xs font-black active:scale-90 transition flex items-center justify-center hover:bg-rose-500 hover:text-white shrink-0"
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