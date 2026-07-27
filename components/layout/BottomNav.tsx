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
    <div className="fixed bottom-6 left-0 right-0 z-50 px-5 max-w-md mx-auto pointer-events-none">
      <nav
        className="
          pointer-events-auto
          h-[96px]
          rounded-[32px]
          flex
          items-center
          justify-around
          px-2.5
          shadow-2xl
          border
          border-[#FFF4E3]/40
          backdrop-blur-md
          relative
          overflow-hidden
        "
        style={{
          background: "#F0D5B3",
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
                w-[82px]
                h-[80px]
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
              {/* Sfondo attivo Verde Salvia (#6C9A8B) */}
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

              {/* Icona Super Ingrandita (48px) */}
              <div
                className={`
                  transition-transform
                  duration-300
                  flex
                  items-center
                  justify-center
                  ${
                    isActive
                      ? "scale-110 -translate-y-1"
                      : "scale-100 opacity-80"
                  }
                `}
              >
                <CustomIcon name={item.icon} size={48} className="drop-shadow-sm" />
              </div>

              {/* Etichetta di testo */}
              <span
                className={`
                  text-[11px]
                  font-extrabold
                  leading-none
                  transition-all
                  duration-200
                  ${isActive ? "mt-1.5" : "mt-1"}
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