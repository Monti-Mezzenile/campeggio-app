import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundManager>
      <div className="relative min-h-dvh w-full flex flex-col justify-between overflow-x-hidden">
        {/* 
          pb-[calc(92px+env(safe-area-inset-bottom))] garantisce che lo scroll si fermi 
          esattamente sopra la BottomNav senza lasciare buchi vuoti.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(92px+env(safe-area-inset-bottom))] touch-pan-y w-full max-w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </BackgroundManager>
  );
}