import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, CheckCircle, XCircle, Loader2, Volume2, VolumeX } from "lucide-react";

interface QRScannerProps {
  onScan: (code: string) => Promise<{ success: boolean; message: string }>;
  isProcessing?: boolean;
}

export function QRScanner({ onScan, isProcessing = false }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; name?: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<string>("");
  const processingRef = useRef(false);

  // Success/error sounds
  const playSound = useCallback((type: 'success' | 'error') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
      // Pleasant success beep
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1108, audioContext.currentTime + 0.1); // C#6
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else {
      // Error buzz
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, [soundEnabled]);

  const handleScan = useCallback(async (decodedText: string) => {
    // Prevent duplicate scans
    if (processingRef.current || decodedText === lastScannedRef.current) {
      return;
    }
    
    processingRef.current = true;
    lastScannedRef.current = decodedText;
    
    try {
      const result = await onScan(decodedText);
      setLastResult({ ...result });
      playSound(result.success ? 'success' : 'error');
      
      // Reset for next scan after delay
      setTimeout(() => {
        lastScannedRef.current = "";
        processingRef.current = false;
        // Clear result after showing it
        setTimeout(() => setLastResult(null), 2000);
      }, 1500);
    } catch (err: any) {
      setLastResult({ success: false, message: err.message || "Scan failed" });
      playSound('error');
      processingRef.current = false;
      lastScannedRef.current = "";
    }
  }, [onScan, playSound]);

  const startScanning = useCallback(async () => {
    if (!containerRef.current) return;
    
    setError(null);
    setLastResult(null);
    
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleScan,
        () => {} // Ignore scan failures
      );
      
      setIsScanning(true);
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setError(err.message || "Could not access camera. Please check permissions.");
      setIsScanning(false);
    }
  }, [handleScan]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Scanner Controls */}
      <div className="flex items-center justify-between">
        <Button
          onClick={isScanning ? stopScanning : startScanning}
          variant={isScanning ? "destructive" : "default"}
          size="lg"
          className="flex-1 mr-2"
        >
          {isScanning ? (
            <>
              <CameraOff className="h-5 w-5 mr-2" />
              Stop Scanner
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              Start Camera Scanner
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {/* Scanner View */}
      {isScanning && (
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative">
            <div 
              id="qr-reader" 
              ref={containerRef}
              className="w-full"
              style={{ minHeight: '300px' }}
            />
            
            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            )}
            
            {/* Result overlay */}
            {lastResult && (
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                  lastResult.success 
                    ? 'bg-green-500/90' 
                    : 'bg-red-500/90'
                }`}
              >
                <div className="text-center text-white p-4">
                  {lastResult.success ? (
                    <CheckCircle className="h-16 w-16 mx-auto mb-2" />
                  ) : (
                    <XCircle className="h-16 w-16 mx-auto mb-2" />
                  )}
                  <p className="text-xl font-bold">{lastResult.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Instructions */}
      {isScanning && !lastResult && (
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          Point camera at attendee's QR code...
        </p>
      )}
    </div>
  );
}

