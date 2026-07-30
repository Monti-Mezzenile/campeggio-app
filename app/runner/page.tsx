{/* 🖼️ SFONDO ESTERNO (runner-bg.png con sfocatura leggera) */}
<div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
  <img
    src="/runner-bg.png"
    alt="Sfondo"
    className="w-full h-full object-cover blur-sm scale-105 opacity-65 brightness-75"
    onError={(e) => {
      (e.target as HTMLImageElement).src = '/Backgr.png';
    }}
  />
</div>