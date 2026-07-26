"use client";

import { useParams, useRouter } from "next/navigation";
import MediaSection from "@/components/media/MediaSection";
import CustomIcon from "@/components/ui/CustomIcon";

export default function MediaPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

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
            Galleria & Media
          </span>
        </div>

        <div className="w-10" />
      </header>

      {/* 📸 HERO BANNER */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-full inline-block">
            📸 Ricordi Spedizione
          </span>
          <h1 className="text-2xl font-black text-[#1b2b25] tracking-tight">
            Foto e Video
          </h1>
          <p className="text-xs font-bold text-[#1b2b25]/60">
            Tutti gli scatti, i video e i momenti migliori
          </p>
        </div>

        <CustomIcon name="foto" size={72} className="shrink-0 drop-shadow-sm" />
      </section>

      {/* 🖼️ CONTENITORE MEDIA SECTION */}
      <section className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-4 border border-white shadow-sm">
        <MediaSection eventId={eventId} />
      </section>

    </main>
  );
}