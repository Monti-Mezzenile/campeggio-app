import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  // Sfondo scuro per integrarsi con l'header notturno
  themeColor: "#0b1319", 
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
    statusBarStyle: "black-translucent", // Fa passare lo sfondo scuro sotto la barra di stato
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
    // Cambiato bg-[#ebdec8] in bg-[#0b1319] (lo sfondo scuro notturno)
    <html lang="it" className="h-full w-full bg-[#0b1319]">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full w-full bg-[#0b1319] text-[#1F2041] antialiased selection:bg-[#121816] selection:text-[#ebdec8]">
        {children}
      </body>
    </html>
  );
}