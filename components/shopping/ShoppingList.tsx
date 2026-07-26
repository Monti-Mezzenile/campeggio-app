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
    <div className="flex flex-col gap-2">
      {/* BARRA INSERIMENTO SLIM */}
      <div className="flex gap-1.5">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Aggiungi prodotto..."
          className="flex-1 bg-white/80 border border-white/90 rounded-xl px-2.5 py-1 text-xs text-[#1b2b25] placeholder-[#1b2b25]/40 focus:outline-hidden shadow-2xs"
        />
        <button
          onClick={addItem}
          disabled={adding}
          className="bg-[#1b2b25] text-white px-3 py-1 rounded-xl text-xs font-extrabold active:scale-95 transition shadow-2xs disabled:opacity-50"
        >
          {adding ? "..." : "+"}
        </button>
      </div>

      {/* LISTA PRODOTTI COMPATTA */}
      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-0.5">
        {currentItems.length === 0 ? (
          <p className="text-[10px] font-medium text-[#1b2b25]/50 text-center py-2 italic">
            Nessun elemento in questa lista
          </p>
        ) : (
          currentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-md border border-white rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-2xs"
            >
              <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                <input
                  type="checkbox"
                  checked={item.completato}
                  onChange={() => toggleItem(item)}
                  className="w-3.5 h-3.5 rounded-md accent-[#1b2b25] cursor-pointer shrink-0"
                />
                <span
                  className={`text-xs font-bold truncate ${
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
                className="text-[#1b2b25]/30 hover:text-red-500 text-xs px-1 font-bold shrink-0"
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