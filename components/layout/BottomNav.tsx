"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CustomIcon, { IconName } from "@/components/ui/CustomIcon";

interface NavItem {
  name: string;
  href: string;
  icon: IconName;
}

export default function BottomNav() {
  const pathname = usePathname();

  // Nasconde la navbar nella pagina di login/registrazione
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const items: NavItem[] = [
    {
      name: "Home",
      href: "/",
      icon: "tenda-grossa",
    },
    {
      name: "storico",
      href: "/history",
      icon: "libro",
    },
    {
      name: "curiosità",
      href: "/curiosita",
      icon: "lampadina",
    },
    {
      name: "io",
      href: "/profile",
      icon: "profilo",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <nav
        className="
          pointer-events-auto
          w-full
          max-w-md
          mx-auto
          rounded-t-[32px]
          flex
          items-center
          justify-between
          px-3
          pt-2.5
          pb-[calc(10px+env(safe-area-inset-bottom))]
          shadow-[0_-8px_25px_rgba(0,0,0,0.15)]
          border-t
          border-[#FFF4E3]/40
          bg-[#F0D5B3]
          relative
        "
      >
        {/* 
          PROIEZIONE SAFARI: Questo blocco parte dal fondo della nav e scende verso il basso per 128px.
          Sigilla al 100% qualsiasi buco di Safari sotto la safe area senza intaccare gli angoli tondi sopra.
        */}
        <div className="absolute top-full left-0 right-0 h-32 bg-[#F0D5B3] pointer-events-none" />

        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative
                flex
                flex-col
                items-center
                justify-center
                flex-1
                max-w-[80px]
                h-[72px]
                rounded-2xl
                transition-all
                duration-300
                active:scale-95
                select-none
                ${
                  isActive
                    ? "text-[#FFF4E3]"
                    : "text-[#3D3E62] hover:text-[#1B2B25]"
                }
              `}
            >
              {/* Sfondo attivo Verde Salvia */}
              {isActive && (
                <span
                  className="
                    absolute
                    inset-0
                    rounded-2xl
                    -z-10
                    shadow-md
                    border
                    border-white/20
                    transition-all
                    duration-300
                  "
                  style={{
                    background: "#6C9A8B",
                  }}
                />
              )}

              {/* Icona */}
              <div
                className={`
                  transition-transform
                  duration-300
                  flex
                  items-center
                  justify-center
                  ${
                    isActive
                      ? "scale-105 -translate-y-0.5"
                      : "scale-100 opacity-80"
                  }
                `}
              >
                <CustomIcon name={item.icon} size={42} className="drop-shadow-sm" />
              </div>

              {/* Etichetta di testo */}
              <span
                className={`
                  text-[12px]
                  font-extrabold
                  leading-none
                  transition-all
                  duration-200
                  ${isActive ? "mt-1" : "mt-0.5"}
                `}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}