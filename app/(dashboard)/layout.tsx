import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundManager>
      {/* Rimosso overflow-y-auto per permettere al body/window di gestire lo scroll senza spezzare l'area safe */}
      <main className="flex-1 pb-28">
        {children}
      </main>
      <BottomNav />
    </BackgroundManager>
  );
}