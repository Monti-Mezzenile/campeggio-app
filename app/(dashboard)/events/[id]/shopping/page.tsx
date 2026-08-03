"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon from "@/components/ui/CustomIcon";

import ShoppingTabs from "@/components/shopping/ShoppingTabs";
import ShoppingList from "@/components/shopping/ShoppingList";
import MeatSection from "@/components/shopping/MeatSection";
import MenuSection from "@/components/shopping/MenuSection";

export default function ShoppingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState("carne");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [callData, setCallData] = useState<any>(null);
  const [menu, setMenu] = useState<any>(null);
  const [canEditMenu, setCanEditMenu] = useState(false);

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email,ruolo")
        .eq("id", user.id)
        .single();

      setCanEditMenu(
        profile?.ruolo === "admin" ||
          profile?.email === "alexscisci91@gmail.com"
      );
    }

    const { data: shopping, error: shoppingError } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at");

    if (shoppingError) {
      console.log("ERRORE SHOPPING:", shoppingError);
    }

    setItems(shopping || []);

    const { data: call, error: callError } = await supabase
      .from("shopping_calls")
      .select(`
        *,
        profiles:user_id(
          nome
        )
      `)
      .eq("event_id", eventId)
      .eq("tipo", "carne")
      .maybeSingle();

    if (callError) {
      console.log("ERRORE CARNE:", callError);
    }

    setCallData(call);

    const { data: eventMenu } = await supabase
      .from("event_menus")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    setMenu(eventMenu);

    setLoading(false);
  }

  async function takeCarne() {
    if (!user) return;

    const { error } = await supabase.from("shopping_calls").insert({
      event_id: eventId,
      tipo: "carne",
      user_id: user.id,
      assegnato_a: user.id,
      prenotato: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  }

  async function answerCarne(value: boolean) {
    if (!callData) return;

    if (value) {
      const { error } = await supabase
        .from("shopping_calls")
        .update({ prenotato: true })
        .eq("id", callData.id);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("shopping_calls")
        .delete()
        .eq("id", callData.id);

      if (error) {
        alert(error.message);
        return;
      }
    }

    loadData();
  }

  async function cancelCarne() {
    if (!callData) return;

    const { error } = await supabase
      .from("shopping_calls")
      .delete()
      .eq("id", callData.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  }

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  if (loading) {
    return (
      <main className="min-h-screen p-3 w-full max-w-lg mx-auto flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-xl flex items-center justify-center shadow-xs animate-pulse mb-2 border border-white">
          <CustomIcon name="carrello" size={22} />
        </div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#1b2b25]/70">
          Caricamento spesa...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-3 pb-20 w-full max-w-lg mx-auto flex flex-col gap-3 select-none">
      
      {/* 🚀 HEADER TOP BAR (COMPATTA) */}
      <header className="flex items-center justify-between pt-0.5">
        <button
          onClick={() => router.back()}
          className="w-7 h-7 rounded-full bg-white/80 text-[#1b2b25] flex items-center justify-center font-black text-xs shadow-xs backdrop-blur-md active:scale-90 transition border border-white"
        >
          ←
        </button>

        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-xs">
          <span className="text-[9px] font-black text-[#1b2b25] tracking-tight uppercase">
            Spesa & Menù
          </span>
        </div>

        <div className="w-7" />
      </header>

      {/* 🛒 HERO BANNER (SLIM) */}
      <section className="w-full bg-white/90 backdrop-blur-2xl rounded-2xl px-4 py-3 border border-white shadow-xs border-l-4 border-l-emerald-500 flex items-center justify-between relative overflow-hidden">
        <div className="space-y-0.5 relative z-10">
          <span className="text-[8px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded-full inline-block">
            🛒 Vettovaglie & Macelleria
          </span>
          <h1 className="text-base font-black text-[#1b2b25] tracking-tight leading-none">
            Spesa di Gruppo
          </h1>
          <p className="text-[10px] font-bold text-[#1b2b25]/60 leading-tight">
            Organizza carne, menù e acquisti
          </p>
        </div>

        <CustomIcon name="carrello" size={38} className="shrink-0 drop-shadow-xs opacity-90" />
      </section>

      {/* 🏷️ TAB NAVIGAZIONE */}
      <div className="w-full">
        <ShoppingTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          items={items}
        />
      </div>

      {/* 🥩 SEZIONE CARNE */}
      {activeTab === "carne" && (
        <MeatSection
          eventId={eventId}
          user={user}
          callData={callData}
          takeCarne={takeCarne}
          answerCarne={answerCarne}
          cancelCarne={cancelCarne}
        />
      )}

      {/* 📋 LISTE SPESA STANDARD (FRESCHI, DISPENSA, BEVANDE, ECC.) */}
      {activeTab !== "carne" && activeTab !== "menu" && (
        <ShoppingList
          eventId={eventId}
          activeTab={activeTab}
          items={items}
          user={user}
          reload={loadData}
        />
      )}

      {/* 🍽️ SEZIONE MENÙ */}
      {activeTab === "menu" && (
        <MenuSection
          eventId={eventId}
          menu={menu}
          setMenu={setMenu}
          canEditMenu={canEditMenu}
        />
      )}

    </main>
  );
}