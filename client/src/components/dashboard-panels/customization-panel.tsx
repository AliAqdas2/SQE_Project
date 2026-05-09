import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { PANEL_REGISTRY, type PanelMetadata } from "./panel-registry";
import { Sparkles } from "lucide-react";

interface CustomizationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledPanels: string[];
  onTogglePanel: (panelId: string) => void;
  enabledModules?: Array<{ module: { moduleKey: string } }>;
}

export function CustomizationPanel({
  open,
  onOpenChange,
  enabledPanels,
  onTogglePanel,
  enabledModules = [],
}: CustomizationPanelProps) {
  // Filter panels based on enabled modules
  const availablePanels = Object.values(PANEL_REGISTRY).filter((panel) => {
    if (!panel.requiresModule) return true;
    return enabledModules.some((em) => em.module.moduleKey === panel.requiresModule);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Dashboard Panels</SheetTitle>
          <SheetDescription>
            Choose which panels to display on your dashboard. Only panels for enabled modules are available.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-6 space-y-4">
          <div className="space-y-3">
            {availablePanels.map((panel) => {
              const isEnabled = enabledPanels.includes(panel.id);
              const Icon = panel.icon;

              return (
                <div
                  key={panel.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium text-sm truncate">{panel.title}</span>
                      {/* Optional: Add sparkle icon for new/premium features */}
                      {panel.id === "kpi-cards" && (
                        <Sparkles className="h-4 w-4 text-yellow-500 shrink-0" />
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => onTogglePanel(panel.id)}
                    data-testid={`switch-panel-${panel.id}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t shrink-0">
          <p className="text-sm text-muted-foreground text-center">
            Need more features? Visit the{" "}
            <Link href="/dashboard/marketplace" className="text-primary hover:underline font-medium">
              Marketplace
            </Link>{" "}
            to enable additional modules.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
