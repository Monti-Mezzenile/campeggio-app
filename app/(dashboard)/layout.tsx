import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundManager>
      <div className="relative h-dvh w-full flex flex-col justify-between overflow-hidden">
        {/* Area dei contenuti con scroll interno */}
        <main className="flex-1 overflow-y-auto overscroll-contain pt-4 pb-28 touch-pan-y h-full">
          {children}
        </main>

        {/* Barra di navigazione attaccata in fondo allo schermo */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-transparent">
          <BottomNav />
        </div>
      </div>
    </BackgroundManager>
  );
}