import "@/app/globals.css";
import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="h-full w-full overflow-x-hidden">
      <body className="h-full w-full max-w-full overflow-x-hidden bg-transparent antialiased">
        <BackgroundManager>
          <div className="relative min-h-dvh w-full flex flex-col justify-between overflow-x-hidden">
            {/* 
              Area dei contenuti: overflow-x-hidden blocca lo scroll laterale.
              pb-32 lascia lo spazio necessario alla barra floating in basso.
            */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[calc(env(safe-area-inset-top)+12px)] pb-32 touch-pan-y w-full max-w-full">
              {children}
            </main>
            <BottomNav />
          </div>
        </BackgroundManager>
      </body>
    </html>
  );
}