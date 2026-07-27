"use client";

import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log(error);
      alert("Errore durante il logout");
      return;
    }

    // Window location per pulire completamente lo stato
    window.location.href = "/login";
  }

  return (
    <button
      onClick={logout}
      className="
        group
        relative
        w-full
        h-12
        flex
        items-center
        justify-center
        gap-3
        bg-rose-500/10
        hover:bg-rose-500
        text-rose-600
        hover:text-white
        border
        border-rose-200
        hover:border-rose-500
        rounded-2xl
        px-4
        font-black
        text-xs
        uppercase
        tracking-wider
        shadow-sm
        hover:shadow-md
        transition-all
        duration-200
        active:scale-95
      "
    >
      {/* Coniglio MOLTO GRANDE che sborda dal riquadro senza modificarne l'altezza */}
      <img
        src="/icons/coniglio-run.png"
        alt="Logout"
        className="
          w-12 
          h-12 
          object-contain 
          shrink-0
          -my-2
          transition-transform 
          duration-300 
          group-hover:translate-x-2.5 
          group-hover:-rotate-12
          group-hover:scale-110
        "
      />
      
      {/* Testo dinamico */}
      <span className="relative z-10">
        <span className="group-hover:hidden">Esci dalla Tana</span>
        <span className="hidden group-hover:inline">A presto!</span>
      </span>
    </button>
  );
}