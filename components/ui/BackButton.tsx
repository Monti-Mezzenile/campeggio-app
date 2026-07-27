"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?: string;
  fallbackHref?: string;
  className?: string;
  onClick?: () => void;
}

export default function BackButton({
  label = "Indietro",
  fallbackHref = "/",
  className = "",
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // 1. Se hai passato un onClick personalizzato, usa quello
    if (onClick) {
      onClick();
      return;
    }

    // 2. Se l'utente ha una cronologia di navigazione, torna indietro
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      // 3. Se è entrato da un link diretto, vai alla pagina di fallback (default: "/")
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`mb-5 inline-flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-zinc-950 active:scale-95 transition-all ${className}`}
    >
      ← {label}
    </button>
  );
}