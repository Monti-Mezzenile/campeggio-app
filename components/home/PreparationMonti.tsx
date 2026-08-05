"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomIcon, { IconName } from "@/components/ui/CustomIcon";

interface PreparationProps {
  eventId: string;
  userId: string;
}

interface PrepItem {
  id: string;
  icon: IconName;
  title: string;
  subtitle: string;
  tag: string;
  link: string;
  bgColor: string;
  textColor: string;
  tagBg: string;
  tagText: string;
}

export default function PreparationMonti({
  eventId,
  userId,
}: PreparationProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PrepItem[]>([]);

  async function loadPreparation() {
    const checks: PrepItem[] = [];

    /* 1. TENDA (Icona: tenda-grossa.png) */
    const { data: tentMember } = await supabase
      .from("tent_members")
      .select("id")
      .eq("user_id", userId);

    if (!tentMember || tentMember.length === 0) {
      checks.push({
        id: "tenda",
        icon: "tenda-grossa",
        title: "Tenda",
        subtitle: "Scegli posto",
        tag: "Notte",
        link: `/events/${eventId}/tents`,
        bgColor: "bg-[#1b2b25]",
        textColor: "text-[#EFE8DB]",
        tagBg: "bg-[#EFE8DB]/20",
        tagText: "text-[#EFE8DB]",
      });
    }

    /* 2. VIAGGIO / MACCHINA */
    const { data: trip } = await supabase
      .from("trips")
      .select("id")
      .eq("event_id", eventId)
      .limit(1)
      .maybeSingle();

    let hasCar = false;
    if (trip) {
      const { data: driverCar } = await supabase
        .from("trip_cars")
        .select("id")
        .eq("trip_id", trip.id)
        .eq("driver_id", userId);

      const { data: passenger } = await supabase
        .from("trip_passengers")
        .select("id")
        .eq("user_id", userId);

      hasCar = !!driverCar?.length || !!passenger?.length;
    }

    if (!hasCar) {
      checks.push({
        id: "macchina",
        icon: "macchina",
        title: "Viaggio",
        subtitle: "Trova auto",
        tag: "Auto",
        link: `/events/${eventId}/cars`,
        bgColor: "bg-[#6c9a8b]",
        textColor: "text-[#EFE8DB]",
        tagBg: "bg-[#1b2b25]/30",
        tagText: "text-[#EFE8DB]",
      });
    }

    /* 3. CARNE (Icona: carne.png) */
    const { data: meatCall } = await supabase
      .from("shopping_calls")
      .select("*")
      .eq("event_id", eventId)
      .eq("tipo", "carne")
      .eq("user_id", userId)
      .eq("prenotato", false)
      .maybeSingle();

    if (meatCall) {
      checks.push({
        id: "carne",
        icon: "carne",
        title: "Carne",
        subtitle: "Quota cibo",
        tag: "Grigliata",
        link: `/events/${eventId}/shopping?tab=carne`,
        bgColor: "bg-[#8b261b]",
        textColor: "text-[#EFE8DB]",
        tagBg: "bg-[#EFE8DB]/20",
        tagText: "text-[#EFE8DB]",
      });
    }

    /* 4. CHECKLIST PERSONALE */
    const { data: myChecklists } = await supabase
      .from("checklists")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .limit(1);

    const myChecklist = myChecklists?.[0];

    if (myChecklist) {
      const { data: checkItems } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("checklist_id", myChecklist.id);

      const total = checkItems?.length || 0;
      const completed =
        checkItems?.filter((item) => item.completato === true).length || 0;

      if (total > 0 && completed < total) {
        checks.push({
          id: "zaino",
          icon: "zaino",
          title: "Zaino",
          subtitle: `${completed}/${total} pronti`,
          tag: "Checklist",
          link: `/events/${eventId}/checklist`,
          bgColor: "bg-[#EFE8DB]",
          textColor: "text-[#1b2b25]",
          tagBg: "bg-[#1b2b25]/10",
          tagText: "text-[#1b2b25]",
        });
      }
    }

    /* 5. MATERIALE / EQUIPMENT */
    const { data: equipment } = await supabase
      .from("event_equipment")
      .select("id")
      .eq("event_id", eventId)
      .eq("assegnato_a", userId)
      .eq("confermato", false);

    if (equipment && equipment.length > 0) {
      checks.push({
        id: "attrezzi",
        icon: "attrezzi",
        title: "Attrezzi",
        subtitle: `${equipment.length} da ok`,
        tag: "Materiale",
        link: `/events/${eventId}/equipment`,
        bgColor: "bg-[#d97706]",
        textColor: "text-white",
        tagBg: "bg-black/20",
        tagText: "text-white",
      });
    }

    setItems(checks);
    setLoading(false);
  }

  useEffect(() => {
    if (eventId && userId) {
      loadPreparation();
    }
  }, [eventId, userId]);

  if (loading) return null;

  return (
    <section className="mt-6">
      {/* Header Sezione */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-black uppercase tracking-widest text-[#EFE8DB]">
          PREPARIAMO IL CAMPO
        </h2>
        {items.length > 0 && (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d97706] text-white">
            {items.length} {items.length === 1 ? "Mancante" : "Mancanti"}
          </span>
        )}
      </div>

      {/* Stato: Tutto Completato */}
      {items.length === 0 ? (
        <div className="bg-[#6c9a8b] rounded-3xl p-5 text-[#EFE8DB] shadow-lg flex items-center justify-between gap-3 border border-[#EFE8DB]/20">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest bg-[#1b2b25]/20 px-2.5 py-1 rounded-full text-[#EFE8DB]">
              EQUIPAGGIAMENTO PRONTO
            </span>
            <h3 className="text-lg font-black mt-2 leading-tight">
              Sei pronto per MONTI!
            </h3>
            <p className="text-xs text-[#EFE8DB]/80 mt-0.5">
              Nessuna azione in sospeso.
            </p>
          </div>
          <CustomIcon name="coniglio" size={68} className="shrink-0" />
        </div>
      ) : (
        /* Carousel Full-Bleed Edge-to-Edge */
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.link)}
              className={`group flex flex-col justify-between w-[135px] h-[160px] p-2.5 rounded-3xl ${item.bgColor} ${item.textColor} shadow-lg active:scale-[0.95] transition-all snap-start shrink-0 text-left relative overflow-hidden`}
            >
              {/* Badge Categoria */}
              <div className="flex items-center justify-between z-10 w-full">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${item.tagBg} ${item.tagText}`}
                >
                  {item.tag}
                </span>
                <span className="text-xs font-black opacity-40 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </div>

              {/* Icona Grande (68px) al centro */}
              <div className="my-auto self-center z-10 group-hover:scale-105 transition-transform">
                <CustomIcon name={item.icon} size={68} className="drop-shadow-md" />
              </div>

              {/* Titolo e Sottotitolo */}
              <div className="z-10 w-full px-1">
                <h3 className="text-xs font-black uppercase tracking-wider leading-tight truncate">
                  {item.title}
                </h3>
                <p className="text-[10px] font-semibold opacity-75 truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}