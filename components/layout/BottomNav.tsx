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
    <nav
      className="
        fixed
        bottom-0
        left-1/2
        -translate-x-1/2
        z-50
        w-full
        max-w-md
        bg-[#F0D5B3]
        rounded-t-[28px]
        flex
        items-center
        justify-between
        px-3
        pt-2.5
        shadow-[0_-6px_20px_rgba(0,0,0,0.15)]
        border-t
        border-[#FFF4E3]/40
      "
      style={{
        paddingBottom: "calc(10px + env(safe-area-inset-bottom, 12px))",
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
              max-w-[80px]
              h-[56px]
              px-1
              py-1
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

            {/* Icona ingrandita a 32px */}
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
              <CustomIcon name={item.icon} size={32} className="drop-shadow-sm" />
            </div>

            {/* Etichetta di testo ingrandita a 12px */}
            <span
              className={`
                text-xs
                font-bold
                leading-tight
                transition-all
                duration-200
                ${isActive ? "mt-0.5" : "mt-0.5"}
              `}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}