import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    // FONDAMENTALE: permette al colore scuro di scorrere sotto l'ora/batteria senza creare blocchi
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
    // Imponiamo lo sfondo scuro #0d1b1e sia su HTML che su BODY
    <html lang="it" className="h-full w-full bg-[#0d1b1e]">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full w-full bg-[#0d1b1e] text-[#1F2041] antialiased selection:bg-[#121816] selection:text-[#ebdec8]">
        {children}
      </body>
    </html>
  );
}