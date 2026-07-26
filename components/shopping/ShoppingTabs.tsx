"use client";

export default function ShoppingTabs({
  activeTab,
  setActiveTab,
  items,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  items: any[];
}) {
  const tabs = [
    { id: "carne", nome: "🥩 Carne" },
    { id: "freschi", nome: "🥬 Freschi" },
    { id: "generi_vari", nome: "📦 Generi vari" },
    { id: "menu", nome: "🍽️ Menù" },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {tabs.map((tab) => {
        const count = items.filter((i) => i.categoria === tab.id).length;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 border
              ${
                isActive
                  ? "bg-[#1b2b25] text-white border-[#1b2b25] shadow-xs"
                  : "bg-white/80 text-[#1b2b25]/80 border-white hover:bg-white shadow-2xs"
              }
            `}
          >
            <span className="truncate">{tab.nome}</span>
            {tab.id !== "menu" && (
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ml-1 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#1b2b25]/10 text-[#1b2b25]"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}