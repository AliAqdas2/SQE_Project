import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignEmbedCodeProps {
  campaignId: string;
  campaignTitle: string;
}

export function CampaignEmbedCode({ campaignId, campaignTitle }: CampaignEmbedCodeProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [widgetWidth, setWidgetWidth] = useState("400");
  const [widgetHeight, setWidgetHeight] = useState("600");

  const baseUrl = window.location.origin;
  const widgetUrl = `${baseUrl}/widget/${campaignId}`;

  // Iframe embed code
  const iframeCode = `<iframe 
  src="${widgetUrl}" 
  width="${widgetWidth}" 
  height="${widgetHeight}" 
  frameborder="0" 
  scrolling="no"
  title="${campaignTitle} - Donation Widget"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
></iframe>`;

  // Button embed code (opens in new window)
  const buttonCode = `<a 
  href="${widgetUrl}" 
  target="_blank" 
  rel="noopener noreferrer"
  style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-family: system-ui, -apple-system, sans-serif;"
>
  Donate to ${campaignTitle}
</a>`;

  // Livestream overlay code (transparent background)
  const overlayCode = `<!-- For OBS Studio or Livestream Software -->
<!-- Add as Browser Source -->
URL: ${widgetUrl}
Width: ${widgetWidth}
Height: ${widgetHeight}
CSS: body { background: transparent; }`;

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Embed Widget
        </CardTitle>
        <CardDescription>
          Add this donation widget to your website, blog, or livestream
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Widget Preview Link */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(widgetUrl, "_blank")}
            className="w-full sm:w-auto"
            data-testid="button-preview-widget"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Widget
          </Button>
          <Input
            value={widgetUrl}
            readOnly
            className="flex-1 font-mono text-sm"
            data-testid="input-widget-url"
          />
        </div>

        {/* Widget Size Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="width">Width (px)</Label>
            <Input
              id="width"
              type="number"
              value={widgetWidth}
              onChange={(e) => setWidgetWidth(e.target.value)}
              data-testid="input-widget-width"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (px)</Label>
            <Input
              id="height"
              type="number"
              value={widgetHeight}
              onChange={(e) => setWidgetHeight(e.target.value)}
              data-testid="input-widget-height"
            />
          </div>
        </div>

        {/* Embed Code Tabs */}
        <Tabs defaultValue="iframe" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="iframe" data-testid="tab-embed-iframe">Iframe</TabsTrigger>
            <TabsTrigger value="button" data-testid="tab-embed-button">Button</TabsTrigger>
            <TabsTrigger value="overlay" data-testid="tab-embed-overlay">Livestream</TabsTrigger>
          </TabsList>

          <TabsContent value="iframe" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Embed the widget directly on your website as an iframe
            </p>
            <div className="relative">
              <pre className="p-4 rounded-md bg-muted overflow-x-auto text-xs">
                <code>{iframeCode}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(iframeCode)}
                data-testid="button-copy-iframe"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="button" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add a donation button that opens the widget in a new window
            </p>
            <div className="relative">
              <pre className="p-4 rounded-md bg-muted overflow-x-auto text-xs">
                <code>{buttonCode}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(buttonCode)}
                data-testid="button-copy-button"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="overlay" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add as a browser source in OBS Studio or other livestreaming software
            </p>
            <div className="relative">
              <pre className="p-4 rounded-md bg-muted overflow-x-auto text-xs">
                <code>{overlayCode}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(overlayCode)}
                data-testid="button-copy-overlay"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold mb-1">OBS Studio Instructions:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Add a new "Browser" source</li>
                <li>Paste the URL above</li>
                <li>Set width and height</li>
                <li>Check "Shutdown source when not visible"</li>
                <li>Add the CSS code to make background transparent</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
