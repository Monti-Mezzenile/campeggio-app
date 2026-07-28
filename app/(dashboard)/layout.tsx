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
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[calc(env(safe-area-inset-top)+12px)] pb-32 touch-pan-y w-full max-w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </BackgroundManager>
  );
}