import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOSDevice: boolean;
  promptInstall: () => Promise<void>;
  dismissReminder: () => void;
  shouldShowReminder: boolean;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shouldShowReminder, setShouldShowReminder] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(isIOS);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (!isStandalone && (!dismissed || Date.now() - dismissedTime > sevenDaysInMs)) {
      setShouldShowReminder(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShouldShowReminder(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShouldShowReminder(false);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShouldShowReminder(false);
      localStorage.removeItem('pwa-install-dismissed');
    }

    setDeferredPrompt(null);
  };

  const dismissReminder = () => {
    setShouldShowReminder(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <PWAInstallContext.Provider
      value={{
        isInstallable: !!deferredPrompt || (isIOSDevice && !isInstalled),
        isInstalled,
        isIOSDevice,
        promptInstall,
        dismissReminder,
        shouldShowReminder,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (context === undefined) {
    throw new Error("usePWAInstall must be used within a PWAInstallProvider");
  }
  return context;
}
