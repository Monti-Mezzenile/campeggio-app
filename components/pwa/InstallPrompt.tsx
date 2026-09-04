'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

type MobilePlatform = 'android' | 'ios';

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<MobilePlatform | null>(null);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const navigatorWithStandalone = navigator as NavigatorWithStandalone;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigatorWithStandalone.standalone === true;

    if (isStandalone) return;

    const userAgent = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/i.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgent);

    if (!isIOS && !isAndroid) return;

    const initialRenderFrame = window.requestAnimationFrame(() => {
      setPlatform(isIOS ? 'ios' : 'android');
      setIsOpen(true);
    });

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setIsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.cancelAnimationFrame(initialRenderFrame);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const installOnAndroid = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);

    if (choice.outcome === 'accepted') {
      setIsOpen(false);
    }
  };

  if (!isOpen || !platform) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-monti-title"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-[#ebdec8]/30 bg-[#1b2b25] p-6 text-[#ebdec8] shadow-2xl">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#ebdec8]/25 bg-white/10 text-sm font-black"
          aria-label="Chiudi"
        >
          ✕
        </button>

        <Image
          src="/apple-touch-icon.png"
          alt="MONTI"
          width={80}
          height={80}
          className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover shadow-lg"
        />

        <h2
          id="install-monti-title"
          className="whitespace-nowrap text-center text-xl font-black tracking-tight"
        >
          Installa MONTI
        </h2>

        {platform === 'android' ? (
          <div className="mt-4 space-y-4 text-center">
            <p className="text-sm font-medium leading-relaxed text-[#ebdec8]/85">
              Aggiungi la web app al telefono per aprirla dalla schermata Home.
            </p>
            {installEvent ? (
              <button
                type="button"
                onClick={installOnAndroid}
                className="w-full whitespace-nowrap rounded-2xl bg-[#ebdec8] px-4 py-3 text-sm font-black text-[#1b2b25] shadow-lg active:scale-[0.98]"
              >
                Installa sul telefono
              </button>
            ) : (
              <p className="rounded-2xl border border-[#ebdec8]/20 bg-white/10 p-3 text-xs font-bold leading-relaxed">
                Apri il menu ⋮ del browser e scegli “Installa app” o “Aggiungi alla schermata Home”.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-center text-sm font-medium text-[#ebdec8]/85">
              Su iPhone segui questi passaggi:
            </p>
            <ol className="space-y-2 text-sm font-bold">
              <li className="rounded-xl bg-white/10 px-3 py-2">1. Tocca i tre punti •••</li>
              <li className="rounded-xl bg-white/10 px-3 py-2">2. Tocca “Condividi”</li>
              <li className="rounded-xl bg-white/10 px-3 py-2">3. Tocca “Visualizza altro”</li>
              <li className="rounded-xl bg-white/10 px-3 py-2">4. Tocca “Aggiungi alla schermata Home”</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
