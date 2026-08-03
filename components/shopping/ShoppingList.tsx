"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ShoppingList({
  eventId,
  activeTab,
  items,
  user,
  reload,
}: {
  eventId: string;
  activeTab: string;
  items: any[];
  user: any;
  reload: () => void;
}) {
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);

  const currentItems = items.filter((item) => item.categoria === activeTab);

  async function addItem() {
    if (!newItem.trim()) return;
    setAdding(true);

    const { error } = await supabase.from("shopping_items").insert({
      event_id: eventId,
      nome: newItem.trim(),
      categoria: activeTab,
      completato: false,
    });

    if (error) {
      alert(error.message);
      setAdding(false);
      return;
    }

    setNewItem("");
    setAdding(false);
    reload();
  }

  async function toggleItem(item: any) {
    const { error } = await supabase
      .from("shopping_items")
      .update({
        completato: !item.completato,
        completato_da: !item.completato ? user?.id : null,
      })
      .eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }

    reload();
  }

  async function deleteItem(item: any) {
    const confirmDelete = window.confirm(`Eliminare "${item.nome}"?`);
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }

    reload();
  }

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border border-white rounded-2xl p-4 shadow-sm space-y-3">
      {/* INTESTAZIONE SEZIONE */}
      <h2 className="text-xs font-black uppercase tracking-wider text-[#1b2b25]/70 flex items-center gap-1.5">
        <span>🛒</span> Lista della Spesa
      </h2>

      {/* FORM AGGIUNTA (STESSO STILE DI MEATSECTION) */}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Aggiungi prodotto..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#1b2b25] placeholder-[#1b2b25]/40 focus:outline-none focus:ring-2 focus:ring-[#1b2b25]/20 shadow-xs"
        />
        <button
          onClick={addItem}
          disabled={adding}
          className="bg-[#1b2b25] text-white px-4 py-2.5 rounded-xl text-sm font-black active:scale-95 transition shadow-xs disabled:opacity-50 shrink-0"
        >
          {adding ? "..." : "+ Aggiungi"}
        </button>
      </div>

      {/* LISTA PRODOTTI */}
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-0.5">
        {currentItems.length === 0 ? (
          <p className="text-xs font-medium text-[#1b2b25]/50 text-center py-4 italic">
            Nessun elemento in questa lista
          </p>
        ) : (
          currentItems.map((item) => (
            <div
              key={item.id}
              className={`border rounded-xl p-3 transition flex items-center justify-between gap-2 shadow-2xs ${
                item.completato
                  ? "bg-slate-100/80 border-slate-200"
                  : "bg-white border-slate-200/80"
              }`}
            >
              <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                <input
                  type="checkbox"
                  checked={item.completato}
                  onChange={() => toggleItem(item)}
                  className="w-4 h-4 rounded-md accent-[#1b2b25] cursor-pointer shrink-0"
                />
                <span
                  className={`text-sm font-bold truncate ${
                    item.completato
                      ? "line-through text-[#1b2b25]/40"
                      : "text-[#1b2b25]"
                  }`}
                >
                  {item.nome}
                </span>
              </label>

              <button
                onClick={() => deleteItem(item)}
                className="text-slate-400 hover:text-red-500 text-sm p-1 font-bold shrink-0 active:scale-90 transition"
                title="Elimina prodotto"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}