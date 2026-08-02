import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundManager>
      {/* 
        STRUTTURA APP SHELL NATIVA (Risolve tutti i bug di Safari iOS)
        Blocca l'intera vista a 100dvh esatti e gestisce lo scroll internamente.
      */}
      <div className="fixed inset-0 z-10 flex flex-col h-[100dvh] w-full overflow-hidden pt-[calc(env(safe-area-inset-top)+0.2rem)]">
        
        {/* Area dei contenuti (Scrollabile Indipendente) */}
        <main className="flex-1 w-full overflow-y-auto overscroll-y-contain">
          <div className="w-full max-w-md mx-auto min-h-full flex flex-col">
            {children}
            
            {/* Spacer fisico per non far "toccare" l'ultimo elemento sulla barra */}
            <div className="w-full shrink-0 h-10" />
          </div>
        </main>

        {/* La BottomNav è spinta naturalmente in basso, niente più 'fixed' */}
        <BottomNav />
      </div>
    </BackgroundManager>
  );
}