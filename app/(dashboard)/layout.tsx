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
        Sostituito pb-28 fisso con calc():
        su Android applica 7.5rem, su iOS aggiunge lo spazio esatto dell'Home Indicator.
      */}
      <main
        className="flex-1 w-full max-w-md mx-auto min-h-dvh"
        style={{
          paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </main>
      <BottomNav />
    </BackgroundManager>
  );
}