import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Smartphone, Share, Download, X } from "lucide-react";

interface PWAInstallPromptProps {
  trigger?: "login" | "registration" | "manual";
  showImmediately?: boolean;
}

export function PWAInstallPrompt({ trigger = "manual", showImmediately = false }: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, isIOSDevice, promptInstall, dismissReminder, shouldShowReminder } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (showImmediately && isInstallable && !isInstalled && shouldShowReminder) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showImmediately, isInstallable, isInstalled, shouldShowReminder]);

  const handleInstall = async () => {
    if (isIOSDevice) {
      setShowIOSInstructions(true);
    } else {
      await promptInstall();
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    dismissReminder();
  };

  const handleRemindLater = () => {
    setIsOpen(false);
  };

  if (isInstalled || !isInstallable || !shouldShowReminder) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-pwa-install">
        {!showIOSInstructions ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <DialogTitle className="text-xl" data-testid="text-install-title">
                    Install Plegit App
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-base pt-2" data-testid="text-install-description">
                {trigger === "registration"
                  ? "Welcome to Plegit! Install our app for the best experience on your device."
                  : "Get quick access to Plegit with our mobile app. Manage donations, campaigns, and events on the go."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="flex items-start gap-3">
                <div className="bg-accent/50 p-1.5 rounded">
                  <Download className="h-4 w-4 text-accent-foreground/70" />
                </div>
                <div>
                  <p className="font-medium text-sm">Fast & Offline Access</p>
                  <p className="text-sm text-muted-foreground">Access your dashboard even without internet</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-accent/50 p-1.5 rounded">
                  <Smartphone className="h-4 w-4 text-accent-foreground/70" />
                </div>
                <div>
                  <p className="font-medium text-sm">Native App Experience</p>
                  <p className="text-sm text-muted-foreground">Works just like a native mobile app</p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="w-full sm:w-auto"
                data-testid="button-dismiss-install"
              >
                Don't Show Again
              </Button>
              <Button
                variant="outline"
                onClick={handleRemindLater}
                className="w-full sm:w-auto"
                data-testid="button-remind-later"
              >
                Remind Me Later
              </Button>
              <Button
                onClick={handleInstall}
                className="w-full sm:w-auto"
                data-testid="button-install-pwa"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" data-testid="text-ios-install-title">
                <Share className="h-5 w-5" />
                Install on iOS
              </DialogTitle>
              <DialogDescription data-testid="text-ios-install-description">
                Follow these steps to install Plegit on your iPhone or iPad
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertTitle className="text-base font-semibold">Step 1</AlertTitle>
                <AlertDescription className="mt-2">
                  Tap the <Share className="inline h-4 w-4 mx-1" /> Share button at the bottom of Safari
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTitle className="text-base font-semibold">Step 2</AlertTitle>
                <AlertDescription className="mt-2">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTitle className="text-base font-semibold">Step 3</AlertTitle>
                <AlertDescription className="mt-2">
                  Tap <strong>"Add"</strong> in the top right corner
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground text-center pt-2">
                The Plegit app icon will appear on your home screen
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowIOSInstructions(false);
                  setIsOpen(false);
                }}
                className="w-full"
                data-testid="button-close-ios-instructions"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, shouldShowReminder, promptInstall, dismissReminder } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled && shouldShowReminder) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, shouldShowReminder]);

  const handleInstall = async () => {
    await promptInstall();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissReminder();
  };

  if (!isVisible || isInstalled || !isInstallable || !shouldShowReminder) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto" data-testid="banner-pwa-install">
      <Alert className="border-primary/20 bg-card shadow-lg">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <AlertTitle className="text-base font-semibold">Install Plegit App</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              Get faster access and work offline
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                data-testid="button-install-banner"
              >
                <Download className="h-3 w-3 mr-1" />
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                data-testid="button-dismiss-banner"
              >
                Not Now
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleDismiss}
            data-testid="button-close-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
