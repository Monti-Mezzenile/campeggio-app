import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundManager>
      <div className="relative h-dvh w-full max-w-md mx-auto flex flex-col justify-between overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(84px+env(safe-area-inset-bottom))] touch-pan-y w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </BackgroundManager>
  );
}