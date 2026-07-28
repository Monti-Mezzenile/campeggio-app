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

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const items: NavItem[] = [
    { name: "Home", href: "/", icon: "tenda-grossa" },
    { name: "storico", href: "/history", icon: "libro" },
    { name: "curiosità", href: "/curiosita", icon: "lampadina" },
    { name: "io", href: "/profile", icon: "profilo" },
  ];

  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        w-full
        max-w-md
        mx-auto
        bg-[#F0D5B3]
        rounded-t-[32px]
        flex
        items-center
        justify-between
        px-4
        pt-3
        pb-[calc(0.75rem+env(safe-area-inset-bottom))]
        shadow-[0_-6px_20px_rgba(0,0,0,0.2)]
        /* FIX PER SCROLL IOS SAFARI */
        transform-gpu
        will-change-transform
        translate-z-0
      "
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
              max-w-[84px]
              h-[64px]
              rounded-2xl
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
            {isActive && (
              <span
                className="
                  absolute
                  inset-0
                  rounded-2xl
                  -z-10
                  shadow-sm
                  transition-all
                  duration-200
                "
                style={{
                  background: "#6C9A8B",
                }}
              />
            )}

            <div
              className={`
                transition-transform
                duration-200
                flex
                items-center
                justify-center
                ${
                  isActive
                    ? "scale-105"
                    : "scale-100 opacity-80"
                }
              `}
            >
              {/* Icona ingrandita da 32 a 35 */}
              <CustomIcon name={item.icon} size={35} className="drop-shadow-sm" />
            </div>

            <span
              className={`
                text-[13px]
                font-extrabold
                leading-none
                capitalize
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
  );
}