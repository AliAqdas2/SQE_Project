import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  campaignName: string;
  url: string;
}

export function QRCodeDisplay({ campaignName, url }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }, (error) => {
        if (error) {
          console.error('Error generating QR code:', error);
        } else {
          setQrGenerated(true);
        }
      });
    }
  }, [url]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `${campaignName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaignName,
          text: `Support ${campaignName}`,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(url);
        // Could show a toast here but keeping it simple for now
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center p-4 bg-white rounded-lg border-4 border-border">
        <canvas 
          ref={canvasRef} 
          className="rounded-lg"
          data-testid="canvas-qr-code"
        />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Scan to donate
        </p>
        <p className="text-xs text-muted-foreground font-mono break-all px-2" data-testid="text-qr-url">
          {url}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          onClick={handleDownload}
          disabled={!qrGenerated}
          data-testid="button-download-qr"
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button 
          variant="outline"
          onClick={handleShare}
          data-testid="button-share-qr"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
