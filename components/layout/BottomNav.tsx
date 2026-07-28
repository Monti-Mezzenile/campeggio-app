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

  // 1. NASCONDE LA NAV NEL LOGIN E REGISTER
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const items: NavItem[] = [
    {
      name: "Home",
      href: "/dashboard", // Corretto da "/" a "/dashboard"
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
    <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto pointer-events-none">
      <nav
        className="
          pointer-events-auto
          rounded-t-[32px]
          flex
          items-center
          justify-around
          px-2
          pt-2.5
          shadow-[0_-8px_25px_rgba(0,0,0,0.15)]
          border-t
          border-x
          border-[#FFF4E3]/50
          backdrop-blur-xl
          relative
          overflow-hidden
        "
        style={{
          backgroundColor: "rgba(240, 213, 179, 0.92)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

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
                h-[70px]
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
              {/* Sfondo attivo */}
              {isActive && (
                <span
                  className="
                    absolute
                    inset-0
                    rounded-2xl
                    -z-10
                    shadow-md
                    border
                    border-white/30
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
                <CustomIcon name={item.icon} size={40} className="drop-shadow-sm" />
              </div>

              {/* Testo */}
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