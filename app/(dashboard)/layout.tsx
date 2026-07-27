import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-dvh w-full overflow-hidden flex flex-col justify-between">
      {/* BackgroundManager avvolge sia il contenuto con scroll sia la barra di navigazione */}
      <BackgroundManager>
        <div className="relative h-full w-full flex flex-col justify-between overflow-hidden">
          {/* Area dei contenuti con scroll interno isolato */}
          <main className="flex-1 overflow-y-auto overscroll-contain pb-28 pt-4 px-4 touch-pan-y h-full">
            {children}
          </main>

          {/* Barra di navigazione fissa in basso con supporto safe-area iOS */}
          <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-transparent pointer-events-auto">
            <BottomNav />
          </div>
        </div>
      </BackgroundManager>
    </div>
  );
}