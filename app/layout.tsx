import type { Metadata, Viewport } from "next";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import InstallPrompt from "@/components/pwa/InstallPrompt";
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
    statusBarStyle: "black-translucent",
    title: "MONTI",
  },
  icons: {
    icon: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="w-full bg-[#0d1b1e] text-[#1F2041] antialiased selection:bg-[#121816] selection:text-[#ebdec8]">
        <PushNotificationManager />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
