import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

// 📱 Configurazione Viewport per eliminare la barra di Safari e abilitare il Fullscreen
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // 👈 Fa estendere la grafica fino ai bordi dello schermo (sotto la Notch / Isola)
  themeColor: "#1b2b25", // 👈 Colore di sfondo della status bar iOS
};

export const metadata: Metadata = {
  title: "MONTI 🏕️",
  description: "Organizza campeggi e avventure con gli amici",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // 👈 Status bar trasparente / immersiva
    title: "MONTI 🏕️",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ${bebas.variable}
        h-full
        antialiased
      `}
    >
      <body
        className="
          min-h-full
          flex
          flex-col
          bg-[#1b2b25]
          pt-[env(safe-area-inset-top)]
          pb-[env(safe-area-inset-bottom)]
        "
      >
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}