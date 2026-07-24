import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import BottomNav from "@/components/layout/BottomNav";


const geistSans = Geist({

  variable: "--font-geist-sans",

  subsets: ["latin"],

});


const geistMono = Geist_Mono({

  variable: "--font-geist-mono",

  subsets: ["latin"],

});



export const metadata: Metadata = {

  title: "MONTI 🏕️",

  description: "Organizza campeggi e avventure con gli amici",

};



export default function RootLayout({

  children,

}: Readonly<{

  children: React.ReactNode;

}>) {


  return (

    <html

      lang="it"

      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}

    >


      <body

        className="
          min-h-full
          flex
          flex-col
          bg-gray-50
        "

      >


        <main className="flex-1">


          {children}


        </main>



      </body>


    </html>

  );

}