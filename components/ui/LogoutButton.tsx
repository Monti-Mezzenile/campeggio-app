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

    // Usiamo window.location.href al posto di router.push per pulire
    // completamente lo stato del server e della pagina.
    window.location.href = "/login";
  }

  return (
    <button
      onClick={logout}
      className="
        w-full
        bg-red-500
        text-white
        rounded-xl
        p-3
        font-semibold
        hover:bg-red-600
        transition
      "
    >
      🐇 Ciao coniglietto
    </button>
  );
}