import type { Metadata, Viewport } from "next";
import "./globals.css";
import BackgroundManager from "@/components/layout/BackgroundManager";
import BottomNav from "@/components/layout/BottomNav";

export const viewport: Viewport = {
  themeColor: "#ebdec8",
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
    <html lang="it" className="h-full bg-transparent">
      <body className="min-h-dvh w-full bg-transparent text-[#1F2041] antialiased">
        <BackgroundManager>
          <div className="relative min-h-dvh max-w-md mx-auto flex flex-col justify-between bg-transparent">
            <main className="flex-1 bg-transparent pb-32">
              {children}
            </main>
            <BottomNav />
          </div>
        </BackgroundManager>
      </body>
    </html>
  );
}