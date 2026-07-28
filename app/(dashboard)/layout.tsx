import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundManager>
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </BackgroundManager>
  );
}