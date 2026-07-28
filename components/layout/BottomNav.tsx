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
          bg-[#F0D5B3]
          rounded-t-[28px]
          flex
          items-center
          justify-between
          px-3
          pt-2
          shadow-[0_-6px_20px_rgba(0,0,0,0.15)]
          border-t
          border-[#FFF4E3]/40
        "
        style={{
          // Gli spazi attorno a '+' in calc() sono OBBLIGATORI in CSS
          // per far processare la safe area ad iOS Safari senza scartare la regola
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 16px))",
        }}
      >
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
                max-w-[72px]
                h-[50px]
                rounded-xl
                transition-all
                duration-200
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
                    rounded-xl
                    -z-10
                    shadow-sm
                    border
                    border-white/20
                    transition-all
                    duration-200
                  "
                  style={{
                    background: "#6C9A8B",
                  }}
                />
              )}

              {/* Icona compattata a 28px */}
              <div
                className={`
                  transition-transform
                  duration-200
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
                <CustomIcon name={item.icon} size={28} className="drop-shadow-sm" />
              </div>

              {/* Etichetta di testo */}
              <span
                className={`
                  text-[10px]
                  font-bold
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