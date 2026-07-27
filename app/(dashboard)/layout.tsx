import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#121614", // Mantiene la barra di stato iOS scura come lo sfondo dell'app
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Estende l'app fino ai bordi dello schermo / Isola Dinamica
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
    apple: "/apple-touch-icon.png", // Icona usata da iOS per la schermata Home
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="bg-[#121614] overscroll-none h-full select-none">
      <body className="bg-[#121614] text-white antialiased overscroll-none min-h-screen w-full overflow-x-hidden touch-pan-y">
        {children}
      </body>
    </html>
  );
}