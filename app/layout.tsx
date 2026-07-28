import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#F0D5B3", // Colorato come la BottomNav per eliminare strisce colorate di sistema
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
    <html lang="it" className="h-full w-full bg-[#F0D5B3] overflow-x-hidden">
      <body className="h-full w-full bg-[#F0D5B3] text-[#1F2041] antialiased overscroll-none overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}