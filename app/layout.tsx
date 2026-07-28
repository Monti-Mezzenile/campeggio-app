import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";

export const viewport: Viewport = {
  themeColor: "#0d1b1e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "MONTI",
  description: "App gestione eventi campeggio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MONTI",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="h-full overflow-hidden bg-[#0d1b1e]">
      <body className="h-full w-full overflow-hidden flex flex-col bg-[#0d1b1e] text-[#1F2041] antialiased selection:bg-[#121816] selection:text-[#ebdec8]">
        
        {/* Contenitore unico con scroll ISOLATO per iOS/Android */}
        <main className="flex-1 w-full overflow-y-auto overscroll-y-contain pb-28 no-scrollbar">
          {children}
        </main>

        {/* Navigazione ancorata fissa in basso */}
        <BottomNav />

      </body>
    </html>
  );
}