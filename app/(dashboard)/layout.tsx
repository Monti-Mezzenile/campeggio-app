import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundManager>
      <div className="relative h-dvh w-full flex flex-col justify-between overflow-x-hidden">
        {/* 
          Area dei contenuti: overflow-x-hidden blocca lo scroll laterale.
          pb-32 lascia lo spazio necessario alla barra in basso.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[calc(env(safe-area-inset-top)+12px)] pb-32 touch-pan-y w-full">
          {children}
        </main>

        {/* La BottomNav gestisce già autonomamente la sua posizione fissa in basso */}
        <BottomNav />
      </div>
    </BackgroundManager>
  );
}